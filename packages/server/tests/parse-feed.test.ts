import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test, type TestContext } from "node:test";
import { ParseItem, ParseItemSchema, ParseService } from "../src/services/ParseService";
import { FeedRefresh } from "../src/shared/lib/feed-refresh";

const serveFeed = async (t: TestContext, xml: string) => {
    const server = createServer((_req, res) => {
        res.setHeader("content-type", "application/rss+xml");
        res.end(xml);
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
    return `http://127.0.0.1:${address.port}/rss`;
};

const makePost = (index: number): ParseItem => ({
    title: `Post ${index}`,
    link: `https://posts.test/${index}`,
    pubDate: new Date(Date.UTC(2026, 0, 1) + index * 60_000).toISOString(),
});

test("post validation falls back to URL GUIDs and plain-text descriptions", () => {
    const result = ParseItemSchema.safeParse({
        guid: "https://posts.test/fallback",
        description: "<p>A <strong>useful</strong> fallback title</p>",
        pubDate: "not a date",
    });
    assert.ok(result.success);
    assert.equal(result.data.link, "https://posts.test/fallback");
    assert.equal(result.data.title, "A useful fallback title");
    assert.equal(result.data.pubDate, null);

    const invalidLink = ParseItemSchema.safeParse({
        title: "Fallback URL",
        link: "not a URL",
        guid: "https://posts.test/valid-guid",
    });
    assert.ok(invalidLink.success);
    assert.equal(invalidLink.data.link, "https://posts.test/valid-guid");
    assert.equal(ParseItemSchema.safeParse({ title: "No link", guid: "opaque-id" }).success, false);
    assert.equal(ParseItemSchema.safeParse({ link: "https://posts.test/no-title" }).success, false);
    assert.equal(
        ParseItemSchema.safeParse({ title: "Unsafe", link: "javascript:alert(1)" }).success,
        false
    );
    assert.equal(ParseItemSchema.safeParse(null).success, false);
});

test("fallback titles are capped and valid ISO dates are retained", () => {
    const result = ParseItemSchema.safeParse({
        description: "Long description ".repeat(100),
        link: "https://posts.test/long-title",
        isoDate: "2026-10-26T12:00:00.000Z",
    });
    assert.ok(result.success);
    assert.equal(result.data.title.length, 120);
    assert.equal(result.data.pubDate, "2026-10-26T12:00:00.000Z");
});

test("bad posts and duplicate links do not reject a valid feed", async t => {
    const url = await serveFeed(
        t,
        `<?xml version="1.0"?><rss version="2.0"><channel>
        <title>Mixed feed</title><link>https://posts.test</link><description>Mixed posts</description>
        <item><title>Valid</title><link>https://posts.test/valid</link></item>
        <item><title>Invalid link</title><link>not-a-url</link></item>
        <item><link>https://posts.test/no-title</link></item>
        <item><guid isPermaLink="true">https://posts.test/fallback</guid><description><![CDATA[<p>Fallback title</p>]]></description></item>
        <item><title>Duplicate</title><link>https://posts.test/valid</link></item>
    </channel></rss>`
    );
    const result = await ParseService.parseRssFeed(url);
    assert.ok(result.success);
    assert.deepEqual(
        result.data.items.map(item => item.link),
        ["https://posts.test/valid", "https://posts.test/fallback"]
    );
    assert.equal(result.data.items[1]?.title, "Fallback title");
});

test("empty feeds are valid and broken XML returns an error", async t => {
    const empty = await serveFeed(
        t,
        '<?xml version="1.0"?><rss version="2.0"><channel><title>Empty</title><link>https://posts.test</link></channel></rss>'
    );
    const result = await ParseService.shouldParseAgain({ url: empty, currentLinks: new Set() });
    assert.ok(result.success);
    assert.deepEqual(result.data, []);
    const broken = await serveFeed(t, "<rss><channel>broken");
    assert.equal(
        (await ParseService.shouldParseAgain({ url: broken, currentLinks: new Set() })).success,
        false
    );
});

test("initial imports select the newest 200 unique posts even in oldest-first feeds", () => {
    const posts = Array.from({ length: 5000 }, (_, index) => makePost(index));
    const initial = FeedRefresh.selectInitialFeedItems(posts);
    assert.equal(initial.length, 200);
    assert.equal(initial[0]?.title, "Post 4999");
    assert.equal(initial[199]?.title, "Post 4800");
    assert.equal(posts[0]?.title, "Post 0");
});

test("refresh does not undo the initial limit or drop large batches of genuinely new posts", () => {
    const posts = Array.from({ length: 5000 }, (_, index) => makePost(index));
    const currentLinks = new Set(FeedRefresh.selectInitialFeedItems(posts).map(item => item.link));
    assert.deepEqual(FeedRefresh.selectNewFeedItems({ items: posts, currentLinks }), []);
    const fresh = Array.from({ length: 300 }, (_, index) => makePost(index + 5000));
    const result = FeedRefresh.selectNewFeedItems({ items: [...posts, ...fresh], currentLinks });
    assert.equal(result.length, 300);
    assert.ok(result.every(item => Number(item.link.split("/").at(-1)) >= 5000));
    assert.equal(
        FeedRefresh.selectNewFeedItems({ items: posts, currentLinks: new Set() }).length,
        200
    );
});

test("new posts are detected by link, not by title or presence of publication dates", async t => {
    const url = await serveFeed(
        t,
        `<?xml version="1.0"?><rss version="2.0"><channel>
        <title>Repeated titles</title><link>https://posts.test</link>
        <item><title>Same title</title><link>https://posts.test/old</link></item>
        <item><title>Same title</title><link>https://posts.test/new</link></item>
    </channel></rss>`
    );
    const result = await ParseService.shouldParseAgain({
        url,
        currentLinks: new Set(["https://posts.test/old"]),
    });
    assert.ok(result.success);
    assert.equal(result.data.length, 1);
    assert.equal(result.data[0]?.link, "https://posts.test/new");
    assert.ok(result.data[0]?.pubDate instanceof Date);
});
