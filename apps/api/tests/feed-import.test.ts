import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { Queue } from "bullmq";
import type { FeedImportAccepted, FeedImportStatus } from "model";
import type { AuthVariables } from "../src/instance";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const testRedisUrl = process.env.TEST_REDIS_URL;
const waitFor = async (condition: () => Promise<boolean>) => {
    const deadline = Date.now() + 20_000;
    while (!(await condition())) {
        assert.ok(Date.now() < deadline, "Timed out waiting for import");
        await new Promise(resolve => setTimeout(resolve, 25));
    }
};

test(
    "background feed imports",
    { skip: !testDatabaseUrl || !testRedisUrl, timeout: 120_000 },
    async t => {
        assert.ok(testDatabaseUrl && testRedisUrl);
        const suffix = randomUUID().replaceAll("-", "");
        const schema = `import_test_${suffix}`;
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
            cwd: fileURLToPath(new URL("../../../packages/db/", import.meta.url)),
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
        const prefix = `import-test-${suffix}`;
        const { redisConfig } = await import("../../../packages/server/src/workers/config");
        redisConfig.connection = connection;
        redisConfig.prefix = prefix;
        const {
            importFeedsWorker,
            fetchRssFeedWorker,
            fetchContentWithoutImageWorker,
            FeedService,
            FeedImportService,
            FeedRepository,
        } = await import("server");
        const importer = importFeedsWorker();
        const queue = importer.getQueue();
        const batches: string[] = [];
        const workers = [importer, fetchRssFeedWorker(), fetchContentWithoutImageWorker()];
        t.after(async () => {
            const client = await queue.client;
            if (batches.length) {
                await client.del(...batches.map(id => queue.toKey(`batch-${id}`)));
            }
            await Promise.all(workers.map(worker => worker.close()));
            for (const worker of workers) {
                const cleanup = new Queue(worker.getQueue().name, { connection, prefix });
                try {
                    await cleanup.obliterate({ force: true });
                } finally {
                    await cleanup.close();
                }
            }
        });
        const [first, second, third] = await Promise.all(
            ["first", "second", "third"].map(name =>
                prisma.user.create({ data: { email: `${name}@test.invalid`, externalId: name } })
            )
        );
        assert.ok(first && second && third);
        const { feed } = await import("../src/routes/feed/routes");
        const app = new Hono<{ Variables: AuthVariables }>();
        app.use("*", async (c, next) => {
            c.set("userId", Number(c.req.header("test-user") ?? first.id));
            await next();
        });
        app.route("/feed", feed);

        const hits = new Map<string, number>();
        let active = 0;
        let peak = 0;
        let base = "";
        const server = createServer((req, res) => {
            const path = req.url ?? "/";
            const count = (hits.get(path) ?? 0) + 1;
            hits.set(path, count);
            if (path === "/site") {
                res.setHeader("content-type", "text/html");
                res.end('<html><head><link rel="icon" href="/icon.svg"></head></html>');
                return;
            }
            if (path === "/permanent/rss") {
                res.writeHead(404);
                res.end();
                return;
            }
            if (path === "/always-fail/rss" || (path === "/temporary/rss" && count < 3)) {
                res.writeHead(503);
                res.end();
                return;
            }
            if (path === "/broken/rss") {
                res.end("<rss><channel>broken");
                return;
            }
            active++;
            peak = Math.max(peak, active);
            setTimeout(() => {
                active--;
                const title = path === "/rollback/rss" ? "Rollback" : path;
                const items =
                    path === "/empty/rss"
                        ? ""
                        : `<item><title>${title}</title><link>${base}${path}/post</link></item>`;
                res.setHeader("content-type", "application/rss+xml");
                res.end(
                    `<?xml version="1.0"?><rss version="2.0"><channel><title>Local import</title><link>${base}/site</link>${items}</channel></rss>`
                );
            }, 150);
        });
        await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
        t.after(() => {
            server.closeAllConnections();
            return new Promise<void>(resolve => server.close(() => resolve()));
        });
        const address = server.address();
        assert.ok(address && typeof address !== "string");
        base = `http://127.0.0.1:${address.port}`;
        const post = (urls: string[], userId = first.id) =>
            app.request("/feed/add-many", {
                method: "POST",
                headers: { "content-type": "application/json", "test-user": String(userId) },
                body: JSON.stringify({ urls }),
            });
        const enqueue = async (urls: string[], userId = first.id): Promise<FeedImportAccepted> => {
            const response = await post(urls, userId);
            assert.equal(response.status, 202);
            const body = await response.json();
            assert.equal(body.success, true);
            batches.push(body.data.importId);
            return body.data;
        };
        const status = async (importId: string, userId = first.id): Promise<FeedImportStatus> => {
            const response = await app.request(`/feed/imports/${importId}`, {
                headers: { "test-user": String(userId) },
            });
            assert.equal(response.status, 200);
            assert.equal(response.headers.get("cache-control"), "no-store");
            return (await response.json()).data;
        };
        const finish = async (accepted: FeedImportAccepted, userId = first.id) => {
            await waitFor(async () => (await status(accepted.importId, userId)).finished);
            return status(accepted.importId, userId);
        };

        await t.test(
            "invalid or oversized imports are rejected before anything is queued",
            async () => {
                for (const urls of [
                    [],
                    ["not a url"],
                    ["file:///etc/passwd"],
                    Array.from({ length: 1001 }, () => `${base}/rss`),
                ]) {
                    assert.equal((await post(urls)).status, 400);
                }
                assert.equal(await queue.getWaitingCount(), 0);
            }
        );

        let initial: FeedImportAccepted;
        await t.test(
            "the endpoint returns while workers are offline, with no outbound requests",
            async () => {
                initial = await enqueue(
                    Array.from({ length: 12 }, (_, i) => `${base}/concurrent-${i}/rss`)
                );
                assert.equal(initial.total, 12);
                assert.equal(hits.size, 0);
                assert.equal(await queue.getWaitingCount(), 12);
                const progress = await status(initial.importId);
                assert.equal(progress.finished, false);
                assert.ok(progress.entries.every(entry => entry.status === "queued"));
                const job = await queue.getJob(`${initial.importId}-0`);
                assert.equal(job?.opts.attempts, 3);
                assert.deepEqual(job?.opts.backoff, { type: "exponential", delay: 1_000 });
            }
        );
        await t.test(
            "progress belongs to its user and invalid/unknown IDs are rejected",
            async () => {
                assert.equal(
                    (
                        await app.request(`/feed/imports/${initial.importId}`, {
                            headers: { "test-user": String(second.id) },
                        })
                    ).status,
                    404
                );
                assert.equal((await app.request("/feed/imports/not-an-id")).status, 400);
                assert.equal((await app.request(`/feed/imports/${randomUUID()}`)).status, 404);
            }
        );
        importer.start();
        await t.test(
            "five feeds run concurrently and appear without waiting for the whole import",
            async () => {
                await waitFor(async () => (await status(initial.importId)).imported > 0);
                const partial = await status(initial.importId);
                assert.equal(partial.finished, false);
                const finished = await finish(initial);
                assert.equal(finished.imported, 12);
                assert.equal(finished.failed, 0);
                assert.equal(peak, 5);
                assert.equal(await prisma.feed.count(), 12);
                assert.equal(await prisma.item.count({ where: { userId: first.id } }), 12);
            }
        );
        await t.test(
            "temporary failures retry independently and permanent failures report their URLs",
            async () => {
                const batch = await enqueue([
                    `${base}/temporary/rss`,
                    `${base}/permanent/rss`,
                    `${base}/broken/rss`,
                    `${base}/always-fail/rss`,
                    `${base}/empty/rss`,
                ]);
                await waitFor(async () =>
                    (await status(batch.importId)).entries.some(
                        entry => entry.status === "retrying"
                    )
                );
                assert.equal((await status(batch.importId)).finished, false);
                const finished = await finish(batch);
                assert.equal(finished.imported, 2);
                assert.equal(finished.failed, 3);
                assert.deepEqual(
                    finished.entries
                        .filter(entry => entry.status === "failed")
                        .map(entry => entry.url)
                        .sort(),
                    [
                        `${base}/permanent/rss`,
                        `${base}/broken/rss`,
                        `${base}/always-fail/rss`,
                    ].sort()
                );
                assert.ok(
                    finished.entries
                        .filter(entry => entry.status === "failed")
                        .every(entry => entry.message)
                );
                assert.equal(hits.get("/temporary/rss"), 3);
                assert.equal(hits.get("/always-fail/rss"), 3);
                assert.equal(hits.get("/permanent/rss"), 1);
                assert.equal(hits.get("/broken/rss"), 1);
            }
        );
        await t.test("duplicate and concurrent imports are idempotent across users", async () => {
            const url = `${base}/shared/rss`;
            const [a, b] = await Promise.all([
                enqueue([url, ` ${url} `]),
                enqueue([url], second.id),
            ]);
            assert.equal(a.total, 1);
            await Promise.all([finish(a), finish(b, second.id)]);
            const saved = await prisma.feed.findUniqueOrThrow({
                where: { rssUrl: url },
                include: { users: true, contentItems: true },
            });
            assert.equal(saved.users.length, 2);
            assert.equal(saved.contentItems.length, 1);
            assert.equal(await prisma.item.count({ where: { feedId: saved.id } }), 2);
            await prisma.item.updateMany({
                where: { feedId: saved.id, userId: first.id },
                data: { isRead: true, isFavorite: true, isBookmarked: true },
            });
            await finish(await enqueue([url]));
            const retained = await prisma.item.findFirstOrThrow({
                where: { feedId: saved.id, userId: first.id },
            });
            assert.ok(retained.isRead && retained.isFavorite && retained.isBookmarked);
            const repeatables = await fetchRssFeedWorker().getQueue().getRepeatableJobs();
            assert.equal(repeatables.length, await prisma.feed.count());
            assert.equal(await fetchContentWithoutImageWorker().getQueue().getWaitingCount(), 1);
        });
        await t.test(
            "item failures roll back new feeds, posts, and subscriptions together",
            async () => {
                await prisma.$executeRawUnsafe(
                    `CREATE FUNCTION reject_import_item() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF EXISTS (SELECT 1 FROM "ItemContent" WHERE "id" = NEW."contentId" AND "title" = 'Rollback') THEN RAISE EXCEPTION 'Intentional import rollback'; END IF; RETURN NEW; END $$`
                );
                await prisma.$executeRawUnsafe(
                    `CREATE TRIGGER reject_import_item BEFORE INSERT ON "Item" FOR EACH ROW EXECUTE FUNCTION reject_import_item()`
                );
                try {
                    const result = await FeedService.addFeed(`${base}/rollback/rss`, first.id, {
                        requestAttempts: 1,
                    });
                    assert.equal(result.success, false);
                    assert.equal(
                        await prisma.feed.count({ where: { rssUrl: `${base}/rollback/rss` } }),
                        0
                    );
                    assert.equal(
                        await prisma.itemContent.count({ where: { title: "Rollback" } }),
                        0
                    );
                    const existing = await prisma.feed.create({
                        data: {
                            name: "Rollback",
                            url: base,
                            rssUrl: `${base}/existing-rollback/rss`,
                            contentItems: {
                                create: {
                                    title: "Rollback",
                                    link: `${base}/existing-rollback/post`,
                                    lastFetch: new Date(),
                                    pubDate: new Date(),
                                },
                            },
                        },
                    });
                    await assert.rejects(
                        FeedRepository.saveSubscription({
                            rssUrl: existing.rssUrl,
                            userId: third.id,
                        }),
                        /Intentional import rollback/
                    );
                    assert.equal(
                        await prisma.feed.count({
                            where: { id: existing.id, users: { some: { id: third.id } } },
                        }),
                        0
                    );
                    assert.equal(await prisma.item.count({ where: { feedId: existing.id } }), 0);
                } finally {
                    await prisma.$executeRawUnsafe('DROP TRIGGER reject_import_item ON "Item"');
                }
            }
        );
        await t.test(
            "unexpected worker failures do not leave progress stuck importing",
            async () => {
                let attempts = 0;
                const mocked = t.mock.method(FeedService, "addFeed", async () => {
                    attempts++;
                    throw new Error("Unexpected import failure");
                });
                try {
                    const finished = await finish(await enqueue([`${base}/unexpected/rss`]));
                    assert.equal(attempts, 3);
                    assert.equal(finished.failed, 1);
                    assert.equal(finished.entries[0]?.message, "Unexpected import failure");
                } finally {
                    mocked.mock.restore();
                }
            }
        );
        await t.test(
            "completed progress survives queue job cleanup and expires after seven days",
            async () => {
                const job = await queue.getJob(`${initial.importId}-0`);
                assert.ok(job);
                await job.remove();
                const saved = await FeedImportService.getStatus({
                    importId: initial.importId,
                    userId: first.id,
                });
                assert.ok(saved.success && saved.data.finished);
                const client = await queue.client;
                client.defineCommand("importTestTtl", {
                    numberOfKeys: 1,
                    lua: 'return redis.call("TTL", KEYS[1])',
                });
                const ttl = Number(
                    await client.runCommand("importTestTtl", [
                        queue.toKey(`batch-${initial.importId}`),
                    ])
                );
                assert.ok(ttl > 6 * 24 * 60 * 60 && ttl <= 7 * 24 * 60 * 60);
            }
        );
    }
);
