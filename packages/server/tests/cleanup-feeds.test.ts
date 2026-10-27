import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const testRedisUrl = process.env.TEST_REDIS_URL;

test(
    "orphaned feeds are removed with their content and refresh schedule",
    { skip: !testDatabaseUrl || !testRedisUrl },
    async t => {
        assert.ok(testDatabaseUrl && testRedisUrl);
        process.env.NODE_ENV = "test";

        const suffix = randomUUID().replaceAll("-", "");
        const schema = `cleanup_test_${suffix}`;
        const database = new URL(testDatabaseUrl);
        database.searchParams.set("schema", schema);
        process.env.DATABASE_URL = database.toString();

        const { prisma } = await import("db");
        t.after(async () => {
            try {
                const { fetchRssFeedWorker } =
                    await import("../src/workers/runners/fetch-rss-feed/fetch-rss-feed-worker");
                await fetchRssFeedWorker().getQueue().obliterate({ force: true });
                await fetchRssFeedWorker().close();
                await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
            } finally {
                await prisma.$disconnect();
            }
        });
        await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);

        const migration = spawnSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
            cwd: fileURLToPath(new URL("../../db/", import.meta.url)),
            env: process.env,
            encoding: "utf8",
            timeout: 60_000,
        });
        assert.equal(migration.status, 0, `${migration.stdout}\n${migration.stderr}`);

        const { redisConfig } = await import("../src/workers/config");
        const redis = new URL(testRedisUrl);
        redisConfig.connection = {
            host: redis.hostname,
            port: Number(redis.port) || 6379,
            password: decodeURIComponent(redis.password) || undefined,
        };
        redisConfig.prefix = `cleanup-test-${suffix}`;

        const { cleanupOrphanedFeeds } =
            await import("../src/workers/runners/cleanup-feeds/cleanup-feeds-worker");
        const { fetchRssFeedWorker } =
            await import("../src/workers/runners/fetch-rss-feed/fetch-rss-feed-worker");
        const { FeedRepository } = await import("../src/repositories/FeedRepository");

        const user = await prisma.user.create({
            data: { email: "cleanup@test.invalid", externalId: "cleanup" },
        });
        const active = await prisma.feed.create({
            data: {
                name: "Active",
                url: "https://active.test",
                rssUrl: "https://active.test/rss",
                users: { connect: { id: user.id } },
            },
        });
        const orphan = await prisma.feed.create({
            data: {
                name: "Orphan",
                url: "https://orphan.test",
                rssUrl: "https://orphan.test/rss",
            },
        });
        const recent = await prisma.feed.create({
            data: {
                name: "Recent",
                url: "https://recent.test",
                rssUrl: "https://recent.test/rss",
            },
        });

        const content = await prisma.itemContent.create({
            data: {
                feedId: orphan.id,
                title: "Orphan post",
                link: "https://orphan.test/post",
                lastFetch: new Date(),
                pubDate: new Date(),
            },
        });
        const item = await prisma.item.create({
            data: {
                feedId: orphan.id,
                userId: user.id,
                contentId: content.id,
            },
        });
        await prisma.tag.create({
            data: {
                name: "orphan-tag",
                userId: user.id,
                items: { connect: { id: item.id } },
            },
        });

        const savedFeeds = await Promise.all(
            ["bookmarked", "favorite"].map(async kind => {
                const saved = await prisma.feed.create({
                    data: {
                        name: kind,
                        url: `https://${kind}.test`,
                        rssUrl: `https://${kind}.test/rss`,
                    },
                });
                const post = await prisma.itemContent.create({
                    data: {
                        feedId: saved.id,
                        title: kind,
                        link: `https://${kind}.test/post`,
                        lastFetch: new Date(),
                        pubDate: new Date(),
                    },
                });
                await prisma.item.create({
                    data: {
                        userId: user.id,
                        feedId: saved.id,
                        contentId: post.id,
                        isBookmarked: kind === "bookmarked",
                        isFavorite: kind === "favorite",
                    },
                });
                return saved;
            })
        );

        const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
        await prisma.$executeRaw`UPDATE "Feed" SET "updatedAt" = ${old} WHERE "id" IN (${active.id}, ${orphan.id})`;
        await prisma.feed.updateMany({
            where: { id: { in: savedFeeds.map(feed => feed.id) } },
            data: { updatedAt: old },
        });

        await fetchRssFeedWorker().repeatable({ feedId: orphan.id }, 60 * 60 * 1_000);

        const logs: string[] = [];
        const result = await cleanupOrphanedFeeds({
            info: message => logs.push(message),
            error: message => logs.push(`ERROR: ${message}`),
        });

        assert.deepEqual(result, { found: 1, deleted: 1, skipped: 0, failed: 0 });
        assert.equal(await prisma.feed.count({ where: { id: orphan.id } }), 0);
        assert.equal(await prisma.itemContent.count({ where: { feedId: orphan.id } }), 0);
        assert.equal(await prisma.item.count({ where: { feedId: orphan.id } }), 0);
        assert.equal(await prisma.feed.count({ where: { id: active.id } }), 1);
        assert.equal(await prisma.feed.count({ where: { id: recent.id } }), 1);

        const tagLinks = await prisma.$queryRaw<{ count: bigint }[]>`
            SELECT count(*) FROM "_ItemToTag" WHERE "A" = ${item.id}
        `;
        assert.equal(Number(tagLinks[0]?.count ?? 0), 0);

        const repeatable = await fetchRssFeedWorker().getQueue().getRepeatableJobs();
        assert.equal(
            repeatable.some(job => job.id === `feed-${orphan.id}`),
            false
        );
        assert.ok(logs.some(message => message.includes("Deleted orphaned feed")));

        for (const saved of savedFeeds) {
            // Also guard the delete itself if a bookmark was added after candidate selection.
            assert.deepEqual(await FeedRepository.deleteFeed(saved.id), {
                success: true,
                data: false,
            });
            assert.equal(await prisma.item.count({ where: { feedId: saved.id } }), 1);
            assert.equal(await prisma.itemContent.count({ where: { feedId: saved.id } }), 1);
        }
        await prisma.item.updateMany({
            where: { feedId: { in: savedFeeds.map(feed => feed.id) } },
            data: { isBookmarked: false, isFavorite: false },
        });
        const afterUnsave = await cleanupOrphanedFeeds({ info: () => {}, error: () => {} });
        assert.deepEqual(afterUnsave, { found: 2, deleted: 2, skipped: 0, failed: 0 });
    }
);
