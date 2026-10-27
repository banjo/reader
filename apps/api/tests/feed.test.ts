import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import type { AuthVariables } from "../src/instance";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

test("feed counts, lookups, and subscriptions", { skip: !testDatabaseUrl }, async t => {
    assert.ok(testDatabaseUrl);
    const schema = `feed_test_${randomUUID().replaceAll("-", "")}`;
    const url = new URL(testDatabaseUrl);
    url.searchParams.set("schema", schema);
    process.env.DATABASE_URL = url.toString();
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

    const { FeedRepository, FeedService, ItemRepository } = await import("server");
    const { feed: feedRoutes } = await import("../src/routes/feed/routes");
    const { items: itemRoutes } = await import("../src/routes/items/routes");
    const users = await Promise.all(
        ["first", "second", "third"].map(name =>
            prisma.user.create({ data: { email: `${name}@test.invalid`, externalId: name } })
        )
    );
    const [firstUser, secondUser, thirdUser] = users;
    assert.ok(firstUser && secondUser && thirdUser);
    const shared = await prisma.feed.create({
        data: {
            name: "Shared feed",
            url: "https://shared.test",
            rssUrl: "https://shared.test/rss",
            users: { connect: [{ id: firstUser.id }, { id: secondUser.id }] },
        },
    });
    const empty = await prisma.feed.create({
        data: {
            name: "Empty feed",
            url: "https://empty.test",
            rssUrl: "https://empty.test/rss",
            users: { connect: { id: firstUser.id } },
        },
    });
    const unfollowed = await prisma.feed.create({
        data: {
            name: "Unfollowed feed",
            url: "https://unfollowed.test",
            rssUrl: "https://unfollowed.test/rss",
        },
    });
    const content = await Promise.all(
        Array.from({ length: 5 }, (_, index) =>
            prisma.itemContent.create({
                data: {
                    feedId: shared.id,
                    title: `Post ${index}`,
                    link: `https://shared.test/${index}`,
                    lastFetch: new Date(),
                    pubDate: new Date(),
                },
            })
        )
    );
    const firstContent = content[0];
    const thirdContent = content[2];
    assert.ok(firstContent && thirdContent);
    await prisma.itemContent.create({
        data: {
            feedId: unfollowed.id,
            title: "Preview",
            link: "https://unfollowed.test/post",
            lastFetch: new Date(),
            pubDate: new Date(),
        },
    });
    await prisma.item.createMany({
        data: content.map((post, index) => ({
            feedId: shared.id,
            contentId: post.id,
            userId: firstUser.id,
            isRead: index === 4,
            isBookmarked: [1, 3, 4].includes(index),
            isFavorite: [2, 3, 4].includes(index),
        })),
    });
    await prisma.item.createMany({
        data: content.slice(0, 2).map(post => ({
            feedId: shared.id,
            contentId: post.id,
            userId: secondUser.id,
            isBookmarked: true,
            isFavorite: true,
        })),
    });

    let signedInUserId = firstUser.id;
    const app = new Hono<{ Variables: AuthVariables }>();
    app.use("*", async (c, next) => {
        c.set("userId", signedInUserId);
        await next();
    });
    app.route("/feed", feedRoutes);
    app.route("/items", itemRoutes);

    await t.test("sidebar counts are user-scoped, numeric, and include empty feeds", async () => {
        const result = await FeedRepository.getAllFeedsByUserId(firstUser.id);
        assert.ok(result.success);
        assert.equal(result.data.length, 2);
        const summary = result.data.find(feed => feed.id === shared.id);
        assert.ok(summary);
        assert.equal(summary.totalItemsCount, 5);
        assert.equal(summary.totalItemsUnreadCount, 4);
        assert.equal(summary.bookmarkedItemsUnreadCount, 2);
        assert.equal(summary.favoriteItemsUnreadCount, 2);
        assert.equal("items" in summary, false);
        assert.doesNotThrow(() => JSON.stringify(result.data));
        const emptySummary = result.data.find(feed => feed.id === empty.id);
        assert.ok(emptySummary);
        assert.equal(emptySummary.totalItemsCount, 0);
        assert.equal(emptySummary.totalItemsUnreadCount, 0);
        assert.equal(emptySummary.bookmarkedItemsUnreadCount, 0);
        assert.equal(emptySummary.favoriteItemsUnreadCount, 0);

        const other = await FeedRepository.getAllFeedsByUserId(secondUser.id);
        assert.ok(other.success);
        const otherSummary = other.data[0];
        assert.ok(otherSummary);
        assert.equal(otherSummary.totalItemsCount, 2);
        const noFeeds = await FeedRepository.getAllFeedsByUserId(thirdUser.id);
        assert.ok(noFeeds.success);
        assert.deepEqual(noFeeds.data, []);
    });

    await t.test("feed counts apply every status filter without counting other users", async () => {
        for (const [filter, expected] of [
            [{}, 5],
            [{ isRead: false }, 4],
            [{ isRead: true }, 1],
            [{ isBookmarked: true }, 3],
            [{ isFavorite: true }, 3],
            [{ isRead: false, isBookmarked: true }, 2],
            [{ isRead: false, isFavorite: false }, 2],
        ] as const) {
            const result = await FeedRepository.getFeedItemsCount({
                internalIdentifier: shared.internalIdentifier,
                userId: firstUser.id,
                filter,
            });
            assert.ok(result.success);
            assert.equal(result.data, expected);
        }
        const result = await FeedService.getFeedItemsCount({
            internalIdentifier: shared.internalIdentifier,
            userId: secondUser.id,
            filter: {},
        });
        assert.ok(result.success);
        assert.equal(result.data, 2);
    });

    await t.test("feed lookups and subscription updates return no items or content", async () => {
        for (const result of [
            await FeedRepository.getFeedByRssUrl(shared.rssUrl),
            await FeedRepository.getFeedByInternalIdentifier(shared.internalIdentifier),
            await FeedRepository.addFeedToUser(empty.id, secondUser.id),
        ]) {
            assert.ok(result.success);
            assert.equal("items" in result.data, false);
            assert.equal("contentItems" in result.data, false);
        }
    });

    await t.test("HTTP responses keep the sidebar contract and correct page totals", async () => {
        const response = await app.request("/feed");
        assert.equal(response.status, 200);
        const body = await response.json();
        assert.deepEqual(
            body.data.find(
                (entry: { internalIdentifier: string }) =>
                    entry.internalIdentifier === shared.internalIdentifier
            ),
            {
                title: shared.name,
                imageUrl: null,
                internalIdentifier: shared.internalIdentifier,
                totalItemsCount: 5,
                totalItemsUnreadCount: 4,
                bookmarkedItemsUnreadCount: 2,
                favoriteItemsUnreadCount: 2,
            }
        );
        const subscribed = await app.request(`/feed/${shared.internalIdentifier}`);
        assert.equal((await subscribed.json()).data.pagination.total, 5);
        const preview = await app.request(`/feed/${unfollowed.internalIdentifier}`);
        assert.equal((await preview.json()).data.pagination.total, 1);
    });

    await t.test("pages are stable when posts share a publish date", async () => {
        signedInUserId = firstUser.id;
        const pubDate = new Date("2026-01-01T00:00:00Z");
        const [followedTie, unfollowedTie] = await Promise.all(
            ["followed-tie", "unfollowed-tie"].map(name =>
                prisma.feed.create({
                    data: { name, url: `https://${name}.test`, rssUrl: `https://${name}.test/rss` },
                })
            )
        );
        assert.ok(followedTie && unfollowedTie);
        for (const tieFeed of [followedTie, unfollowedTie]) {
            await prisma.itemContent.createMany({
                data: Array.from({ length: 7 }, (_, index) => ({
                    feedId: tieFeed.id,
                    title: `Tie ${index}`,
                    link: `${tieFeed.url}/${index}`,
                    lastFetch: pubDate,
                    pubDate,
                })),
            });
        }
        await prisma.feed.update({
            where: { id: followedTie.id },
            data: { users: { connect: { id: firstUser.id } } },
        });
        await ItemRepository.assignFeedItemsToUser({
            feedId: followedTie.id,
            userId: firstUser.id,
        });

        const collectIds = async (internalIdentifier: string, key: "items" | "contentItems") => {
            const ids: number[] = [];
            for (let page = 1; page <= 3; page++) {
                const response = await app.request(
                    `/feed/${internalIdentifier}?page=${page}&pageSize=3`
                );
                const body = await response.json();
                assert.equal(body.data.pagination.total, 7);
                ids.push(...body.data.data[key].map((entry: { id: number }) => entry.id));
            }
            return ids;
        };

        const itemIds = await collectIds(followedTie.internalIdentifier, "items");
        assert.equal(itemIds.length, 7);
        assert.equal(new Set(itemIds).size, 7);
        assert.deepEqual(
            itemIds,
            [...itemIds].sort((a, b) => b - a)
        );

        const contentIds = await collectIds(unfollowedTie.internalIdentifier, "contentItems");
        assert.equal(contentIds.length, 7);
        assert.equal(new Set(contentIds).size, 7);
        assert.deepEqual(
            contentIds,
            [...contentIds].sort((a, b) => b - a)
        );
    });

    await t.test("page and page size are clamped and fall back on invalid values", async () => {
        signedInUserId = firstUser.id;
        const path = `/feed/${shared.internalIdentifier}`;
        for (const [query, page, pageSize] of [
            ["page=abc&pageSize=xyz", 1, 12],
            ["page=0&pageSize=0", 1, 1],
            ["page=-3&pageSize=-5", 1, 1],
            ["page=2&pageSize=1000", 2, 100],
        ] as const) {
            const response = await app.request(`${path}?${query}`);
            const body = await response.json();
            assert.equal(body.success, true, query);
            assert.deepEqual(body.data.pagination, { page, pageSize, total: 5 }, query);
        }
    });

    await t.test("bulk assignment is concurrent-safe and preserves existing statuses", async () => {
        const results = await Promise.all(
            Array.from({ length: 3 }, () =>
                ItemRepository.assignFeedItemsToUser({ feedId: shared.id, userId: secondUser.id })
            )
        );
        assert.ok(results.every(result => result.success));
        assert.equal(await prisma.item.count({ where: { userId: secondUser.id } }), 5);
        const retained = await prisma.item.findFirstOrThrow({
            where: { userId: secondUser.id, contentId: firstContent.id },
        });
        assert.ok(retained.isBookmarked && retained.isFavorite);
        const added = await prisma.item.findFirstOrThrow({
            where: { userId: secondUser.id, contentId: thirdContent.id },
        });
        assert.equal(added.isRead, false);
        assert.equal(added.isBookmarked, false);
        assert.equal(added.isFavorite, false);
        assert.ok(added.createdAt instanceof Date && added.updatedAt instanceof Date);
        const emptyResult = await ItemRepository.assignFeedItemsToUser({
            feedId: empty.id,
            userId: thirdUser.id,
        });
        assert.ok(emptyResult.success);
        assert.equal(await prisma.item.count({ where: { userId: thirdUser.id } }), 0);
    });

    await t.test(
        "subscribe, repeat subscribe, unsubscribe, and add-existing-feed work",
        async () => {
            signedInUserId = thirdUser.id;
            const path = `/feed/${shared.internalIdentifier}`;
            for (let attempt = 0; attempt < 2; attempt++) {
                const response = await app.request(`${path}/subscribe`, { method: "POST" });
                assert.equal((await response.json()).success, true);
            }
            assert.equal(await prisma.item.count({ where: { userId: thirdUser.id } }), 5);
            const response = await app.request(`${path}/unsubscribe`, { method: "POST" });
            assert.equal((await response.json()).success, true);
            assert.equal(await prisma.item.count({ where: { userId: thirdUser.id } }), 0);
            const sidebar = await app.request("/feed");
            assert.deepEqual((await sidebar.json()).data, []);
            const added = await FeedService.addFeed(shared.rssUrl, thirdUser.id);
            assert.ok(added.success);
            assert.equal(added.data.feedId, shared.id);
            assert.equal(await prisma.item.count({ where: { userId: thirdUser.id } }), 5);
        }
    );

    await t.test("search is case-insensitive, capped, and excludes subscribed feeds", async () => {
        signedInUserId = firstUser.id;
        await prisma.feed.createMany({
            data: Array.from({ length: 25 }, (_, index) => ({
                name: `Needle ${String(index).padStart(2, "0")}`,
                url: `https://needle-${index}.test`,
                rssUrl: `https://needle-${index}.test/rss`,
            })),
        });
        const followedMatch = await prisma.feed.create({
            data: {
                name: "NEEDLE followed",
                url: "https://followed-needle.test",
                rssUrl: "https://followed-needle.test/rss",
                users: { connect: { id: firstUser.id } },
            },
        });
        await prisma.feed.create({
            data: {
                name: "Unrelated",
                description: "A desc-only-needle result",
                url: "https://description.test",
                rssUrl: "https://description.test/rss",
            },
        });

        const response = await app.request("/feed/search?query=nEeDlE");
        assert.equal(response.status, 200);
        const result = await response.json();
        assert.equal(result.success, true);
        assert.equal(result.data.length, 20);
        assert.ok(result.data.every((feed: { name: string }) => feed.name.startsWith("Needle ")));
        assert.ok(
            result.data.every(
                (feed: { internalIdentifier: string }) =>
                    feed.internalIdentifier !== followedMatch.internalIdentifier
            )
        );
        assert.deepEqual(Object.keys(result.data[0]).sort(), [
            "description",
            "imageUrl",
            "internalIdentifier",
            "name",
            "rssUrl",
            "url",
        ]);

        const described = await app.request("/feed/search?query=DESC-ONLY-NEEDLE");
        assert.deepEqual(
            (await described.json()).data.map((feed: { name: string }) => feed.name),
            ["Unrelated"]
        );
        assert.equal((await app.request("/feed/search?query=description.test")).status, 200);
        assert.equal((await app.request(`/feed/search?query=${"x".repeat(101)}`)).status, 400);
        for (const query of ["", "%20%20"]) {
            assert.equal((await app.request(`/feed/search?query=${query}`)).status, 400);
        }
    });

    await t.test(
        "article search filters title, description, and content with matching totals",
        async () => {
            const reader = await prisma.user.create({
                data: { email: "searcher@test.invalid", externalId: "searcher" },
            });
            const other = await prisma.user.create({
                data: { email: "other-searcher@test.invalid", externalId: "other-searcher" },
            });
            const followed = await prisma.feed.create({
                data: {
                    name: "Searchable",
                    url: "https://searchable.test",
                    rssUrl: "https://searchable.test/rss",
                    users: { connect: [{ id: reader.id }, { id: other.id }] },
                },
            });
            const preview = await prisma.feed.create({
                data: {
                    name: "Search preview",
                    url: "https://search-preview.test",
                    rssUrl: "https://search-preview.test/rss",
                },
            });
            const now = new Date("2026-02-01T00:00:00Z");
            const posts = await Promise.all(
                [
                    {
                        title: "Alpha Needle Title",
                        description: "overview",
                        content: "body",
                    },
                    {
                        title: "Plain",
                        description: "A beta NEEDLE in the summary",
                        content: null,
                    },
                    {
                        title: "Plain body",
                        description: null,
                        content: "Gamma needle inside the article",
                    },
                    {
                        title: "100%_done",
                        description: "weather",
                        content: "sunshine",
                    },
                    {
                        title: "Q".repeat(120),
                        description: "capped",
                        content: "capped body",
                    },
                ].map((post, index) =>
                    prisma.itemContent.create({
                        data: {
                            feedId: followed.id,
                            link: `https://searchable.test/${index}`,
                            lastFetch: now,
                            pubDate: new Date(now.getTime() + index * 1000),
                            ...post,
                        },
                    })
                )
            );
            await prisma.itemContent.createMany({
                data: [
                    {
                        feedId: preview.id,
                        title: "Preview Needle",
                        link: "https://search-preview.test/needle",
                        lastFetch: now,
                        pubDate: now,
                    },
                    {
                        feedId: preview.id,
                        title: "Other preview",
                        link: "https://search-preview.test/other",
                        lastFetch: now,
                        pubDate: now,
                    },
                ],
            });
            const [bookmarked, read, , wildcard, capped] = posts;
            assert.ok(bookmarked && read && wildcard && capped);
            await prisma.item.createMany({
                data: posts.map(post => ({
                    feedId: followed.id,
                    contentId: post.id,
                    userId: reader.id,
                    isRead: post.id === read.id,
                    isBookmarked: post.id === bookmarked.id,
                    isFavorite: post.id === read.id,
                })),
            });
            await prisma.item.create({
                data: {
                    feedId: followed.id,
                    contentId: bookmarked.id,
                    userId: other.id,
                },
            });
            signedInUserId = reader.id;

            try {
                const needle = "nEeDlE";
                const list = await app.request(`/items?search=${needle}&pageSize=1`);
                assert.equal(list.status, 200);
                const listBody = await list.json();
                assert.equal(listBody.data.pagination.total, 3);
                assert.equal(listBody.data.data.length, 1);
                assert.match(JSON.stringify(listBody.data.data[0].content), /needle/i);

                const bookmarkedOnly = await app.request(
                    `/items?search=${needle}&isBookmarked=true&pageSize=12`
                );
                const bookmarkedBody = await bookmarkedOnly.json();
                assert.equal(bookmarkedBody.data.pagination.total, 1);
                assert.equal(bookmarkedBody.data.data[0].content.title, "Alpha Needle Title");

                const unread = await app.request(`/items?search=${needle}&isRead=false`);
                assert.equal((await unread.json()).data.pagination.total, 2);

                const wildcardResponse = await app.request(
                    `/items?search=${encodeURIComponent("100%_done")}&pageSize=12`
                );
                const wildcardBody = await wildcardResponse.json();
                assert.equal(wildcardBody.data.pagination.total, 1);
                assert.equal(wildcardBody.data.data[0].content.title, "100%_done");

                const blank = await app.request("/items?search=%20%20&pageSize=12");
                assert.equal((await blank.json()).data.pagination.total, 5);

                const cappedResponse = await app.request(
                    `/items?query=${"Q".repeat(150)}&pageSize=12`
                );
                const cappedBody = await cappedResponse.json();
                assert.equal(cappedResponse.status, 200);
                assert.equal(cappedBody.data.pagination.total, 1);
                assert.equal(cappedBody.data.data[0].contentId, capped.id);

                const missed = await app.request(`/items?search=${`Z${"Q".repeat(100)}`}`);
                assert.equal((await missed.json()).data.pagination.total, 0);

                const repositoryCount = await ItemRepository.getItemCount(reader.id, {
                    search: "needle",
                });
                const repositoryPage = await ItemRepository.getAllItemsByUserId(
                    reader.id,
                    { page: 2, pageSize: 1 },
                    { search: "  needle  " }
                );
                assert.ok(repositoryCount.success && repositoryPage.success);
                assert.equal(repositoryCount.data, 3);
                assert.equal(repositoryPage.data.length, 1);

                const feedResponse = await app.request(
                    `/feed/${followed.internalIdentifier}?search=needle&pageSize=1`
                );
                const feedBody = await feedResponse.json();
                assert.equal(feedBody.data.pagination.total, 3);
                assert.equal(feedBody.data.data.items.length, 1);
                const feedCount = await FeedRepository.getFeedItemsCount({
                    internalIdentifier: followed.internalIdentifier,
                    userId: reader.id,
                    filter: { search: "NEEDLE", isFavorite: true },
                });
                assert.ok(feedCount.success);
                assert.equal(feedCount.data, 1);

                const previewResponse = await app.request(
                    `/feed/${preview.internalIdentifier}?search=needle&pageSize=12`
                );
                const previewBody = await previewResponse.json();
                assert.equal(previewBody.data.pagination.total, 1);
                assert.deepEqual(
                    previewBody.data.data.contentItems.map(
                        (entry: { title: string }) => entry.title
                    ),
                    ["Preview Needle"]
                );
                const previewCount = await FeedRepository.getFeedContentCount(
                    preview.internalIdentifier,
                    { search: "   " }
                );
                assert.ok(previewCount.success);
                assert.equal(previewCount.data, 2);
            } finally {
                signedInUserId = firstUser.id;
            }
        }
    );
});
