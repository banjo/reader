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
        const { addImageWorker } =
            await import("../src/workers/runners/add-image/add-image-worker");
        const { verifyImagesWorker } =
            await import("../src/workers/runners/verify-images/verify-images-worker");
        const { refreshArticlesWorker } =
            await import("../src/workers/runners/refresh-articles/refresh-articles-worker");
        const { FeedRepository } = await import("../src/repositories/FeedRepository");
        const { ItemRepository } = await import("../src/repositories/ItemRepository");
        const { FeedService } = await import("../src/services/FeedService");
        const fetcher = fetchRssFeedWorker();
        const delivery = addToUsersWorker();
        const images = fetchContentWithoutImageWorker();
        const imageLookup = addImageWorker();
        const verification = verifyImagesWorker();
        const refresher = refreshArticlesWorker();
        const imageEvents = new QueueEvents(imageLookup.getQueue().name, { connection, prefix });
        const verifyEvents = new QueueEvents(verification.getQueue().name, { connection, prefix });
        const refreshEvents = new QueueEvents(refresher.getQueue().name, { connection, prefix });
        const events = new QueueEvents(fetcher.getQueue().name, { connection, prefix });
        const deliveryEvents = new QueueEvents(delivery.getQueue().name, { connection, prefix });
        const legacyProducer = new Queue<{
            feedId: number;
            content: { id: number; title: string; content: string }[];
        }>(delivery.getQueue().name, { connection, prefix });
        t.after(async () => {
            await Promise.all([
                fetcher.close(),
                delivery.close(),
                images.close(),
                imageLookup.close(),
                verification.close(),
                refresher.close(),
            ]);
            await Promise.all([
                events.close(),
                deliveryEvents.close(),
                imageEvents.close(),
                verifyEvents.close(),
                refreshEvents.close(),
                legacyProducer.close(),
            ]);
            for (const name of [
                fetcher.getQueue().name,
                delivery.getQueue().name,
                images.getQueue().name,
                imageLookup.getQueue().name,
                verification.getQueue().name,
                refresher.getQueue().name,
            ]) {
                const cleanup = new Queue(name, { connection, prefix });
                try {
                    await cleanup.obliterate({ force: true });
                } finally {
                    await cleanup.close();
                }
            }
        });
        await Promise.all([
            events.waitUntilReady(),
            deliveryEvents.waitUntilReady(),
            imageEvents.waitUntilReady(),
            verifyEvents.waitUntilReady(),
            refreshEvents.waitUntilReady(),
        ]);
        fetcher.start();
        delivery.start();
        imageLookup.start();
        verification.start();
        refresher.start();

        let mainPosts = 2;
        let largePosts = 5000;
        let broken = false;
        let base = "";
        const requestCounts = new Map<string, number>();
        let activeImages = 0;
        let peakImages = 0;
        const server = createServer((req, res) => {
            const path = req.url ?? "/";
            const requestCount = (requestCounts.get(path) ?? 0) + 1;
            requestCounts.set(path, requestCount);
            if (path === "/photo.png") {
                res.writeHead(200, { "content-type": "image/png" });
                res.end("png");
                return;
            }
            if (path === "/image-timeout") {
                res.writeHead(200, { "content-type": "text/html" });
                res.write("<html><head>");
                return;
            }
            if (
                path === "/image-fail" ||
                (path === "/image-recover" && requestCount < 3) ||
                (path === "/recover/rss" && requestCount < 3)
            ) {
                res.writeHead(503);
                res.end("Temporary failure");
                return;
            }
            if (path === "/permanent/rss") {
                res.writeHead(404);
                res.end();
                return;
            }
            if (path.startsWith("/image-concurrent/")) {
                activeImages++;
                peakImages = Math.max(peakImages, activeImages);
                res.setHeader("content-type", "text/html");
                setTimeout(() => {
                    activeImages--;
                    res.end(
                        '<html><head><meta property="og:image" content="/photo.png"></head></html>'
                    );
                }, 100);
                return;
            }
            if (path === "/main/post-0") {
                res.setHeader("content-type", "text/html");
                res.end(`<html><head>
                    <meta property="og:title" content="Refreshed title">
                    <meta property="og:description" content="Refreshed description">
                    <meta property="og:image" content="/photo.png">
                </head></html>`);
                return;
            }
            if (path === "/image-recover") {
                res.setHeader("content-type", "text/html");
                res.end(
                    '<html><head><meta property="og:image" content="/photo.png"></head></html>'
                );
                return;
            }
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

        const createImagePost = (path: string) =>
            prisma.itemContent.create({
                data: {
                    feedId: feed.id,
                    title: path,
                    link: base + path,
                    lastFetch: new Date(),
                    pubDate: new Date(),
                },
            });
        const queueImage = (post: { id: number; link: string }) =>
            imageLookup.getQueue().add("test-image", { contentId: post.id, url: post.link });

        await t.test("RSS jobs retry temporary failures, but not permanent errors", async () => {
            const recover = await prisma.feed.create({
                data: { name: "Recover", url: base, rssUrl: `${base}/recover/rss` },
            });
            const job = await fetcher.getQueue().add("test-recover", { feedId: recover.id });
            assert.equal(job.opts.attempts, 3);
            assert.deepEqual(job.opts.backoff, { type: "exponential", delay: 1_000 });
            await job.waitUntilFinished(events, 15_000);
            assert.equal(requestCounts.get("/recover/rss"), 3);
            const permanent = await prisma.feed.create({
                data: { name: "Permanent", url: base, rssUrl: `${base}/permanent/rss` },
            });
            await assert.rejects(refresh(permanent.id), /HTTP 404/);
            assert.equal(requestCounts.get("/permanent/rss"), 1);
        });

        await t.test(
            "image retries recover without prematurely marking the post checked",
            async () => {
                const post = await createImagePost("/image-recover");
                const job = await queueImage(post);
                await waitFor(async () => (requestCounts.get("/image-recover") ?? 0) >= 1);
                assert.equal(
                    (await prisma.itemContent.findUniqueOrThrow({ where: { id: post.id } }))
                        .hasFetchedImage,
                    false
                );
                await job.waitUntilFinished(imageEvents, 15_000);
                const saved = await prisma.itemContent.findUniqueOrThrow({
                    where: { id: post.id },
                });
                assert.equal(requestCounts.get("/image-recover"), 3);
                assert.equal(saved.imageUrl, `${base}/photo.png`);
                assert.equal(saved.hasFetchedImage, true);
            }
        );

        await t.test(
            "exhausted image retries remain unchecked; successful no-image pages complete",
            async () => {
                const failed = await createImagePost("/image-fail");
                const job = await queueImage(failed);
                await assert.rejects(
                    job.waitUntilFinished(imageEvents, 15_000),
                    /Temporary image lookup failure/
                );
                assert.equal(requestCounts.get("/image-fail"), 3);
                const saved = await prisma.itemContent.findUniqueOrThrow({
                    where: { id: failed.id },
                });
                assert.equal(saved.hasFetchedImage, false);
                assert.equal(saved.imageUrl, null);
                const missing = await createImagePost("/image-missing");
                await (await queueImage(missing)).waitUntilFinished(imageEvents, 15_000);
                assert.equal(
                    (await prisma.itemContent.findUniqueOrThrow({ where: { id: missing.id } }))
                        .hasFetchedImage,
                    true
                );
                assert.equal(requestCounts.get("/image-missing"), 1);
            }
        );

        await t.test("a real image timeout leaves the post eligible for a later scan", async () => {
            const post = await createImagePost("/image-timeout");
            const job = await imageLookup
                .getQueue()
                .add("test-timeout", { contentId: post.id, url: post.link }, { attempts: 1 });
            await assert.rejects(job.waitUntilFinished(imageEvents, 15_000), /timed out/);
            assert.equal(
                (await prisma.itemContent.findUniqueOrThrow({ where: { id: post.id } }))
                    .hasFetchedImage,
                false
            );
        });

        await t.test("image lookups process five jobs concurrently", async () => {
            const posts = await Promise.all(
                Array.from({ length: 10 }, (_, index) =>
                    createImagePost(`/image-concurrent/${index}`)
                )
            );
            const jobs = await Promise.all(posts.map(queueImage));
            await Promise.all(jobs.map(job => job.waitUntilFinished(imageEvents, 15_000)));
            assert.equal(peakImages, 5);
            assert.equal(
                await prisma.itemContent.count({
                    where: { id: { in: posts.map(post => post.id) }, hasFetchedImage: true },
                }),
                10
            );
        });

        await t.test("image verification clears broken URLs and allows one retry", async () => {
            const valid = await prisma.itemContent.create({
                data: {
                    feedId: feed.id,
                    title: "Valid image",
                    link: `${base}/valid-image`,
                    imageUrl: `${base}/photo.png`,
                    hasFetchedImage: true,
                    lastFetch: new Date(),
                    pubDate: new Date(),
                },
            });
            const brokenImage = await prisma.itemContent.create({
                data: {
                    feedId: feed.id,
                    title: "Broken image",
                    link: `${base}/broken-image`,
                    imageUrl: `${base}/html-image`,
                    hasFetchedImage: true,
                    lastFetch: new Date(),
                    pubDate: new Date(),
                },
            });

            const job = await verification.getQueue().add("test-verify", {});
            await job.waitUntilFinished(verifyEvents, 15_000);

            const savedValid = await prisma.itemContent.findUniqueOrThrow({
                where: { id: valid.id },
            });
            const savedBroken = await prisma.itemContent.findUniqueOrThrow({
                where: { id: brokenImage.id },
            });
            assert.equal(savedValid.imageUrl, `${base}/photo.png`);
            assert.equal(savedBroken.imageUrl, null);
            assert.equal(savedBroken.hasFetchedImage, false);

            const retry = await imageLookup.getQueue().add("test-broken-retry", {
                contentId: brokenImage.id,
                url: `${base}/broken-image`,
            });
            await retry.waitUntilFinished(imageEvents, 15_000);

            const retried = await prisma.itemContent.findUniqueOrThrow({
                where: { id: brokenImage.id },
            });
            assert.equal(retried.imageUrl, null);
            assert.equal(retried.hasFetchedImage, true);
        });

        await t.test("stale articles are refreshed with changed metadata", async () => {
            const link = `${base}/main/post-0`;
            const content = await prisma.itemContent.findUniqueOrThrow({
                where: { feedId_link: { feedId: feed.id, link } },
            });
            await prisma.itemContent.update({
                where: { id: content.id },
                data: {
                    title: "Old title",
                    description: "Old description",
                    imageUrl: null,
                    hasFetchedImage: false,
                    lastFetch: new Date("2020-01-01"),
                },
            });

            const job = await refresher.getQueue().add("test-refresh-articles", {});
            await job.waitUntilFinished(refreshEvents, 20_000);

            const refreshed = await prisma.itemContent.findUniqueOrThrow({
                where: { id: content.id },
            });
            assert.equal(refreshed.title, "Refreshed title");
            assert.equal(refreshed.description, "Refreshed description");
            assert.equal(refreshed.imageUrl, `${base}/photo.png`);
            assert.equal(refreshed.hasFetchedImage, true);
            assert.ok(refreshed.lastFetch > new Date("2024-01-01"));
        });

        await t.test("scheduled RSS refreshes retain the retry policy", async () => {
            await fetcher.repeatable({ feedId: feed.id });
            const jobs = await fetcher
                .getQueue()
                .getJobs(["wait", "delayed", "active", "completed"]);
            const scheduled = jobs.find(job => job.opts.repeat);
            assert.ok(scheduled);
            assert.equal(scheduled.opts.attempts, 3);
            assert.deepEqual(scheduled.opts.backoff, { type: "exponential", delay: 1_000 });
            await fetcher.stopRepeatable();
        });
    }
);
