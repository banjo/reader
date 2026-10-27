import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { gzipSync } from "node:zlib";
import {
    ExternalRequestError,
    externalRequestLimits,
    ExternalRequestService,
} from "../src/services/ExternalRequestService";
import { ParseService } from "../src/services/ParseService";

test("bounded external requests", async t => {
    const hits = new Map<string, number>();
    const rss =
        '<?xml version="1.0"?><rss version="2.0"><channel><title>Local</title><link>https://example.test</link></channel></rss>';
    const head =
        '<html><head><meta property="og:image" content="images/post.png"><link rel="icon" href="icon.svg"></head>';
    const server = createServer((req, res) => {
        const path = req.url ?? "/";
        const count = (hits.get(path) ?? 0) + 1;
        hits.set(path, count);
        if (path === "/network") {
            req.socket.destroy();
            return;
        }
        if (path === "/timeout-headers") {
            return;
        }
        if (path === "/timeout-body") {
            res.writeHead(200, { "content-type": "text/html" });
            res.write("<html><head>");
            return;
        }
        if (path.startsWith("/slow-redirect/")) {
            const remaining = Number(path.split("/").at(-1));
            setTimeout(() => {
                res.writeHead(302, { location: `/slow-redirect/${remaining - 1}` });
                res.end();
            }, 80);
            return;
        }
        if (path.startsWith("/redirect/")) {
            const remaining = Number(path.split("/").at(-1));
            res.writeHead(302, {
                location: remaining ? `/redirect/${remaining - 1}` : "/nested/page",
            });
            res.end();
            return;
        }
        if (path === "/bad-redirect") {
            res.writeHead(302, { location: "file:///etc/passwd" });
            res.end();
            return;
        }
        if (path.startsWith("/status/")) {
            res.writeHead(Number(path.split("/").at(-1)));
            res.end("Unavailable");
            return;
        }
        if ((path === "/recover" || path === "/favicon-recover") && count < 3) {
            res.writeHead(503);
            res.end();
            return;
        }
        if (path === "/declared-large") {
            res.writeHead(200, {
                "content-length": String(externalRequestLimits.rss.maxBytes + 1),
            });
            res.flushHeaders();
            return;
        }
        if (path === "/chunked-large") {
            res.writeHead(200, { "content-type": "application/rss+xml" });
            res.write("x".repeat(externalRequestLimits.rss.maxBytes));
            res.end("x");
            return;
        }
        if (path === "/compressed-large") {
            res.writeHead(200, { "content-encoding": "gzip" });
            res.end(gzipSync("x".repeat(externalRequestLimits.rss.maxBytes + 1)));
            return;
        }
        if (path === "/rss") {
            res.setHeader("content-type", "application/rss+xml");
            res.end(rss);
            return;
        }
        if (path === "/broken-rss") {
            res.end("<rss><channel>broken");
            return;
        }
        if (path === "/json") {
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ html: head }));
            return;
        }
        if (path.endsWith(".png")) {
            res.writeHead(200, { "content-type": "image/png" });
            res.end(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
            return;
        }
        if (path.endsWith(".svg")) {
            res.writeHead(200, { "content-type": "image/svg+xml" });
            res.end("<svg xmlns='http://www.w3.org/2000/svg'/>");
            return;
        }
        res.setHeader("content-type", "text/html; charset=utf-8");
        if (path === "/article") {
            res.end(`<html><head>
                <meta property="og:title" content="Updated post | Test Site">
                <meta property="og:description" content="A better summary">
                <meta property="og:image" content="/photo.png">
            </head><body>Article</body></html>`);
            return;
        }
        if (path === "/missing-article") {
            res.writeHead(404);
            res.end("Not found");
            return;
        }
        if (path === "/article-bad-image") {
            res.end(`<html><head>
                <meta property="og:title" content="Only a title">
                <meta property="og:image" content="/html-image">
            </head></html>`);
            return;
        }
        if (path === "/fake-image") {
            res.end('<html><head><meta property="og:image" content="/html-image"></head></html>');
            return;
        }
        if (path === "/head-only") {
            res.write(head);
            return;
        }
        if (path === "/large-html") {
            res.end(
                `<html><head><meta property="og:image" content="/early.png">${" ".repeat(
                    300_000
                )}<link rel="icon" href="/too-late.ico"></head>`
            );
            return;
        }
        if (path === "/missing") {
            res.end("<html><head></head></html>");
            return;
        }
        res.end(`${head}<body>Article</body></html>`);
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    t.after(() => {
        server.closeAllConnections();
        return new Promise<void>(resolve => server.close(() => resolve()));
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    const fetchText = (
        path: string,
        options: Partial<Parameters<typeof ExternalRequestService.fetchText>[0]> = {}
    ) =>
        ExternalRequestService.fetchText({
            url: base + path,
            ...externalRequestLimits.rss,
            backoffMs: 1,
            ...options,
        });
    const permanent = (error: unknown) => error instanceof ExternalRequestError && !error.retryable;

    await t.test(
        "valid RSS still parses and relative metadata uses the final redirect URL",
        async () => {
            const feed = await ParseService.parseRssFeed(`${base}/rss`);
            assert.ok(feed.success);
            assert.equal(feed.data.title, "Local");
            const image = await ParseService.parseImage(`${base}/redirect/2`);
            const favicon = await ParseService.parseFavicon(`${base}/redirect/2`);
            assert.ok(image.success && favicon.success);
            assert.equal(image.data, `${base}/nested/images/post.png`);
            assert.equal(favicon.data, `${base}/nested/icon.svg`);
        }
    );
    await t.test("redirect limits and non-HTTP redirects are permanent failures", async () => {
        await assert.rejects(fetchText("/redirect/3"), permanent);
        assert.equal(hits.get("/redirect/3"), 1);
        await assert.rejects(fetchText("/bad-redirect"), permanent);
        await assert.rejects(
            ExternalRequestService.fetchText({
                url: "file:///etc/passwd",
                ...externalRequestLimits.rss,
            }),
            permanent
        );
    });
    await t.test(
        "redirects share a single deadline rather than resetting the timeout",
        async () => {
            await assert.rejects(
                fetchText("/slow-redirect/2", { timeoutMs: 120, attempts: 1 }),
                error => error instanceof ExternalRequestError && error.retryable
            );
            assert.equal(hits.get("/slow-redirect/2"), 1);
            assert.equal(hits.get("/slow-redirect/1"), 1);
            assert.equal(hits.get("/slow-redirect/0"), undefined);
        }
    );
    await t.test("malformed XML is a permanent parse failure", async () => {
        const result = await ParseService.parseRssFeed(`${base}/broken-rss`);
        assert.ok(!result.success && !result.retryable);
        assert.equal(hits.get("/broken-rss"), 1);
    });
    await t.test(
        "RSS rejects declared, streamed, and decompressed oversized responses without retries",
        async () => {
            for (const path of ["/declared-large", "/chunked-large", "/compressed-large"]) {
                await assert.rejects(fetchText(path), permanent);
                assert.equal(hits.get(path), 1);
            }
        }
    );
    await t.test(
        "HTML stops at the head or byte cap instead of waiting for the full page",
        async () => {
            const response = await fetchText("/head-only", {
                ...externalRequestLimits.html,
                timeoutMs: 500,
            });
            assert.equal(response.text, head);
            const bounded = await fetchText("/large-html", externalRequestLimits.html);
            assert.equal(Buffer.byteLength(bounded.text), externalRequestLimits.html.maxBytes);
            const image = await ParseService.parseImage(`${base}/large-html`);
            assert.ok(image.success);
            assert.equal(image.data, `${base}/early.png`);
            assert.equal((await ParseService.parseFavicon(`${base}/large-html`)).success, false);
        }
    );
    await t.test("image URLs must return an image content type", async () => {
        const image = await ExternalRequestService.fetchImageMetadata({
            url: `${base}/nested/images/post.png`,
            ...externalRequestLimits.image,
        });
        assert.equal(image.contentType, "image/png");

        await assert.rejects(
            ExternalRequestService.fetchImageMetadata({
                url: `${base}/html-image`,
                ...externalRequestLimits.image,
            }),
            permanent
        );

        const broken = await ParseService.parseImage(`${base}/fake-image`);
        assert.ok(!broken.success && !broken.retryable);
        assert.equal(hits.get("/html-image"), 2);
    });
    await t.test("article metadata is parsed for stale posts", async () => {
        const article = await ParseService.parseArticleMetadata(`${base}/article`, {
            siteName: "Test Site",
        });
        assert.ok(article.success);
        assert.equal(article.data.title, "Updated post");
        assert.equal(article.data.description, "A better summary");
        assert.equal(article.data.imageUrl, `${base}/photo.png`);

        const noImage = await ParseService.parseArticleMetadata(`${base}/article-bad-image`);
        assert.ok(noImage.success);
        assert.equal(noImage.data.title, "Only a title");
        assert.equal(noImage.data.imageUrl, undefined);

        const missing = await ParseService.parseArticleMetadata(`${base}/missing-article`);
        assert.ok(!missing.success && !missing.retryable);
        assert.equal(missing.statusCode, 404);
    });

    await t.test("non-HTML responses and missing metadata do not trigger retries", async () => {
        for (const parse of [ParseService.parseImage, ParseService.parseFavicon]) {
            const result = await parse(`${base}/json`);
            assert.ok(!result.success && !result.retryable);
            const missing = await parse(`${base}/missing`);
            assert.ok(!missing.success && missing.type === "NotFound");
        }
        assert.equal(hits.get("/json"), 2);
        assert.equal(hits.get("/missing"), 2);
    });
    await t.test("temporary HTTP failures retry three times and can recover", async () => {
        const response = await fetchText("/recover");
        assert.ok(response.text.includes("og:image"));
        assert.equal(hits.get("/recover"), 3);
        for (const status of [408, 429, 500, 503]) {
            const path = `/status/${status}`;
            await assert.rejects(
                fetchText(path),
                error => error instanceof ExternalRequestError && error.retryable
            );
            assert.equal(hits.get(path), 3);
        }
    });
    await t.test("favicon lookups outside workers also retry temporary failures", async () => {
        const result = await ParseService.parseFavicon(`${base}/favicon-recover`);
        assert.ok(result.success);
        assert.equal(result.data, `${base}/icon.svg`);
        assert.equal(hits.get("/favicon-recover"), 3);
    });
    await t.test("permanent HTTP failures are not retried", async () => {
        for (const status of [400, 401, 403, 404, 410]) {
            const path = `/status/${status}`;
            await assert.rejects(fetchText(path), permanent);
            assert.equal(hits.get(path), 1);
        }
    });
    await t.test(
        "network errors and timeouts before headers or during the body exhaust bounded retries",
        async () => {
            for (const path of ["/network", "/timeout-headers", "/timeout-body"]) {
                const started = Date.now();
                await assert.rejects(
                    fetchText(path, { timeoutMs: 100 }),
                    error => error instanceof ExternalRequestError && error.retryable
                );
                assert.equal(hits.get(path), 3);
                assert.ok(Date.now() - started < 3_000);
            }
        }
    );
});
