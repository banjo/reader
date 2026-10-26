import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Queue, QueueEvents } from "bullmq";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const testRedisUrl = process.env.TEST_REDIS_URL;

const waitFor = async (condition: () => Promise<boolean>) => {
    const deadline = Date.now() + 15_000;
    while (!(await condition())) {
        assert.ok(Date.now() < deadline, "Timed out waiting for the worker");
        await new Promise(resolve => setTimeout(resolve, 50));
    }
};

test(
    "RSS refresh pipeline",
    { skip: !testDatabaseUrl || !testRedisUrl, timeout: 120_000 },
    async t => {
        assert.ok(testDatabaseUrl && testRedisUrl);
        const suffix = randomUUID().replaceAll("-", "");
        const schema = `refresh_test_${suffix}`;
        const database = new URL(testDatabaseUrl);
        database.searchParams.set("schema", schema);
        process.env.DATABASE_URL = database.toString();
        process.env.NODE_ENV = "test";
        const { prisma } = await import("db");
        t.after(async () => {
            try {
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

        const redis = new URL(testRedisUrl);
        const connection = {
            host: redis.hostname,
            port: Number(redis.port) || 6379,
            password: decodeURIComponent(redis.password) || undefined,
            db: Number(redis.pathname.slice(1)) || 0,
        };
        const prefix = `refresh-test-${suffix}`;
        const { redisConfig } = await import("../src/workers/config");
        redisConfig.connection = connection;
        redisConfig.prefix = prefix;
        const { fetchRssFeedWorker } =
            await import("../src/workers/runners/fetch-rss-feed/fetch-rss-feed-worker");
        const { addToUsersWorker } =
            await import("../src/workers/runners/add-to-users/add-to-users-worker");
        const { fetchContentWithoutImageWorker } =
            await import("../src/workers/runners/fetch-content-without-image/fetch-content-without-image-worker");
        const { FeedRepository } = await import("../src/repositories/FeedRepository");
        const { ItemRepository } = await import("../src/repositories/ItemRepository");
        const { FeedService } = await import("../src/services/FeedService");
        const fetcher = fetchRssFeedWorker();
        const delivery = addToUsersWorker();
        const images = fetchContentWithoutImageWorker();
        const events = new QueueEvents(fetcher.getQueue().name, { connection, prefix });
        const deliveryEvents = new QueueEvents(delivery.getQueue().name, { connection, prefix });
        const legacyProducer = new Queue<{
            feedId: number;
            content: { id: number; title: string; content: string }[];
        }>(delivery.getQueue().name, { connection, prefix });
        t.after(async () => {
            await Promise.all([fetcher.close(), delivery.close(), images.close()]);
            await Promise.all([events.close(), deliveryEvents.close(), legacyProducer.close()]);
            for (const name of [
                fetcher.getQueue().name,
                delivery.getQueue().name,
                images.getQueue().name,
            ]) {
                const cleanup = new Queue(name, { connection, prefix });
                try {
                    await cleanup.obliterate({ force: true });
                } finally {
                    await cleanup.close();
                }
            }
        });
        await Promise.all([events.waitUntilReady(), deliveryEvents.waitUntilReady()]);
        fetcher.start();
        delivery.start();

        let mainPosts = 2;
        let largePosts = 5000;
        let broken = false;
        let base = "";
        const server = createServer((req, res) => {
            const path = req.url ?? "/";
            if (!path.endsWith("/rss")) {
                res.setHeader("content-type", "text/html");
                res.end(
                    '<html><head><link rel="icon" href="/icon.svg"></head><body>Local feed</body></html>'
                );
                return;
            }
            if (broken && path === "/main/rss") {
                res.writeHead(500);
                res.end("Unavailable");
                return;
            }
            const large = path === "/large/rss";
            const slug = large ? "large" : "main";
            const count = large ? largePosts : mainPosts;
            const items = Array.from(
                { length: count },
                (_, index) => `
            <item><title>${large ? `Post ${index}` : "Same title"}</title>
            <link>${base}/${slug}/post-${index}</link>
            ${large ? `<pubDate>${new Date(Date.UTC(2026, 0, 1) + index * 60_000).toUTCString()}</pubDate>` : ""}
            <description>Local RSS preview</description></item>`
            ).join("");
            res.setHeader("content-type", "application/rss+xml");
            res.end(
                `<?xml version="1.0"?><rss version="2.0"><channel><title>${slug}</title><link>${base}/${slug}</link>${items}<item><title>Broken post</title><link>not-a-url</link></item></channel></rss>`
            );
        });
        await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
        t.after(
            () =>
                new Promise<void>((resolve, reject) =>
                    server.close(error => {
                        if (error) {
                            reject(error);
                            return;
                        }
                        resolve();
                    })
                )
        );
        const address = server.address();
        assert.ok(address && typeof address !== "string");
        base = `http://127.0.0.1:${address.port}`;

        const users = await Promise.all(
            ["first", "second", "outsider"].map(name =>
                prisma.user.create({ data: { email: `${name}@test.invalid`, externalId: name } })
            )
        );
        const [first, second, outsider] = users;
        assert.ok(first && second && outsider);
        const feed = await prisma.feed.create({
            data: {
                name: "Main",
                url: `${base}/main`,
                rssUrl: `${base}/main/rss`,
                users: { connect: [{ id: first.id }, { id: second.id }] },
            },
        });
        const refresh = async (feedId: number) => {
            const job = await fetcher.getQueue().add("test-refresh", { feedId });
            await job.waitUntilFinished(events, 15_000);
        };

        await t.test(
            "refresh stores posts and fans out ID-only jobs to all followers",
            async () => {
                await refresh(feed.id);
                await waitFor(
                    async () => (await prisma.item.count({ where: { feedId: feed.id } })) === 4
                );
                assert.equal(await prisma.itemContent.count({ where: { feedId: feed.id } }), 2);
                assert.equal(await prisma.item.count({ where: { userId: outsider.id } }), 0);
                const queued = await delivery.getQueue().getJobs(["wait", "active", "completed"]);
                assert.equal(queued.length, 1);
                const job = queued[0];
                assert.ok(job);
                assert.deepEqual(Object.keys(job.data).sort(), ["contentIds", "feedId"]);
                assert.ok(job.data.contentIds.every(id => Number.isInteger(id)));
                const source = await FeedRepository.getFeedForRefresh(feed.id);
                assert.ok(source.success);
                assert.deepEqual(Object.keys(source.data).sort(), ["contentItems", "id", "rssUrl"]);
                assert.ok(
                    source.data.contentItems.every(item => Object.keys(item).join() === "link")
                );
            }
        );

        await t.test(
            "unchanged feeds create neither duplicates nor extra fan-out jobs",
            async () => {
                await refresh(feed.id);
                assert.equal(await prisma.itemContent.count({ where: { feedId: feed.id } }), 2);
                assert.equal(await prisma.item.count({ where: { feedId: feed.id } }), 4);
                assert.equal(
                    await delivery.getQueue().getJobCountByTypes("wait", "active", "completed"),
                    1
                );
            }
        );

        await t.test(
            "new links with repeated titles and no dates still reach both followers",
            async () => {
                mainPosts = 3;
                await refresh(feed.id);
                await waitFor(
                    async () => (await prisma.item.count({ where: { feedId: feed.id } })) === 6
                );
                assert.equal(await prisma.itemContent.count({ where: { feedId: feed.id } }), 3);
            }
        );

        await t.test(
            "repeated, concurrent, and legacy fan-out jobs preserve statuses and feed boundaries",
            async () => {
                const content = await prisma.itemContent.findFirstOrThrow({
                    where: { feedId: feed.id },
                });
                await prisma.item.updateMany({
                    where: { contentId: content.id, userId: first.id },
                    data: { isRead: true, isFavorite: true, isBookmarked: true },
                });
                const otherFeed = await prisma.feed.create({
                    data: { name: "Other", url: `${base}/other`, rssUrl: `${base}/other/rss` },
                });
                const otherPost = await prisma.itemContent.create({
                    data: {
                        feedId: otherFeed.id,
                        title: "Other",
                        link: `${base}/other/post`,
                        lastFetch: new Date(),
                        pubDate: new Date(),
                    },
                });
                const jobs = await Promise.all(
                    Array.from({ length: 3 }, () =>
                        delivery.getQueue().add("test-duplicate-delivery", {
                            feedId: feed.id,
                            contentIds: [content.id, content.id, otherPost.id],
                        })
                    )
                );
                await Promise.all(jobs.map(job => job.waitUntilFinished(deliveryEvents, 15_000)));
                const legacy = await legacyProducer.add("legacy-delivery", {
                    feedId: feed.id,
                    content: [
                        { id: content.id, title: "Old job payload", content: "Old full post" },
                    ],
                });
                await legacy.waitUntilFinished(deliveryEvents, 15_000);
                const retained = await prisma.item.findFirstOrThrow({
                    where: { contentId: content.id, userId: first.id },
                });
                assert.ok(retained.isRead && retained.isFavorite && retained.isBookmarked);
                assert.equal(await prisma.item.count({ where: { contentId: otherPost.id } }), 0);
                assert.equal(await prisma.item.count({ where: { feedId: feed.id } }), 6);
                assert.ok(
                    (
                        await ItemRepository.assignContentToFollowers({
                            feedId: feed.id,
                            contentIds: [],
                        })
                    ).success
                );
            }
        );

        await t.test(
            "delivery respects unsubscribes and parse failures fail the queue job",
            async () => {
                await FeedRepository.removeFeedFromUser(feed.id, second.id);
                mainPosts = 4;
                await refresh(feed.id);
                const added = await prisma.itemContent.findUniqueOrThrow({
                    where: { feedId_link: { feedId: feed.id, link: `${base}/main/post-3` } },
                });
                await waitFor(
                    async () => (await prisma.item.count({ where: { contentId: added.id } })) === 1
                );
                const item = await prisma.item.findFirstOrThrow({ where: { contentId: added.id } });
                assert.equal(item.userId, first.id);
                broken = true;
                await assert.rejects(refresh(feed.id), /Could not refresh feed/);
                broken = false;
            }
        );

        await t.test(
            "large initial imports stay capped across refresh and still receive new posts",
            async () => {
                const created = await FeedService.addFeed(`${base}/large/rss`, first.id);
                assert.ok(created.success);
                const largeFeedId = created.data.feedId;
                await refresh(largeFeedId);
                assert.equal(
                    await prisma.itemContent.count({ where: { feedId: largeFeedId } }),
                    200
                );
                assert.equal(await prisma.item.count({ where: { feedId: largeFeedId } }), 200);
                const oldest = await prisma.itemContent.findFirstOrThrow({
                    where: { feedId: largeFeedId },
                    orderBy: { pubDate: "asc" },
                });
                assert.equal(oldest.title, "Post 4800");
                largePosts = 5001;
                await refresh(largeFeedId);
                await waitFor(
                    async () =>
                        (await prisma.item.count({ where: { feedId: largeFeedId } })) === 201
                );
                assert.equal(
                    await prisma.itemContent.count({ where: { feedId: largeFeedId } }),
                    201
                );
            }
        );
    }
);
