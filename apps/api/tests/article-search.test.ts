import assert from "node:assert/strict";
import { test } from "node:test";
import type { Context } from "hono";
import { articleSearchMaxLength, filterSchema } from "model";
import { parseFilters } from "../src/utils";

const context = (query: Record<string, string>) =>
    ({
        req: { query: () => query },
    }) as Context;

test("filter schema trims and caps article search", () => {
    const parsed = filterSchema.safeParse({
        isRead: false,
        search: `  ${"n".repeat(articleSearchMaxLength + 10)}  `,
    });
    assert.equal(parsed.success, true);
    if (!parsed.success) return;
    assert.equal(parsed.data.isRead, false);
    assert.equal(parsed.data.search?.length, articleSearchMaxLength);
    const blank = filterSchema.safeParse({ search: "   " });
    assert.equal(blank.success, true);
    if (blank.success) {
        assert.equal(blank.data.search, undefined);
    }
});

test("item and feed queries accept search or query and keep status filters", () => {
    assert.deepEqual(parseFilters(context({ search: "  Alpha  ", isRead: "false" })), {
        isRead: false,
        isBookmarked: undefined,
        isFavorite: undefined,
        search: "Alpha",
    });
    assert.equal(parseFilters(context({ query: "Beta" })).search, "Beta");
    assert.equal(parseFilters(context({ search: "kept", query: "ignored" })).search, "kept");
    assert.equal(parseFilters(context({ search: "   ", isBookmarked: "true" })).search, undefined);
    assert.equal(parseFilters(context({ isFavorite: "true" })).isFavorite, true);
    assert.equal(
        parseFilters(context({ search: "Q".repeat(150) })).search?.length,
        articleSearchMaxLength
    );
});
