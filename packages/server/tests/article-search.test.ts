import assert from "node:assert/strict";
import { test } from "node:test";
import { articleSearchMaxLength, normalizeArticleSearch } from "model";

process.env.DATABASE_URL ??= "postgresql://localhost:5432/unused";

const { getContentSearchWhere, getFilterWhere } = await import("../src/shared/lib/utils");

test("article search trims, ignores blanks, and caps the query", () => {
    assert.equal(normalizeArticleSearch(undefined), undefined);
    assert.equal(normalizeArticleSearch(null), undefined);
    assert.equal(normalizeArticleSearch("   "), undefined);
    assert.equal(normalizeArticleSearch("  Needle  "), "Needle");
    assert.equal(normalizeArticleSearch("Q".repeat(articleSearchMaxLength + 25))?.length, 100);
});

test("content search is case-insensitive across title, description, and body", () => {
    assert.equal(getContentSearchWhere(undefined), undefined);
    assert.equal(getContentSearchWhere("   "), undefined);

    const query = "  nEeDlE  ";
    assert.deepEqual(getContentSearchWhere(query), {
        OR: [
            { title: { contains: "nEeDlE", mode: "insensitive" } },
            { description: { contains: "nEeDlE", mode: "insensitive" } },
            { content: { contains: "nEeDlE", mode: "insensitive" } },
        ],
    });

    const capped = "Q".repeat(articleSearchMaxLength);
    assert.deepEqual(
        getFilterWhere({ isRead: false, isBookmarked: true, search: `${capped}extra` }),
        {
            isRead: false,
            isBookmarked: true,
            isFavorite: undefined,
            content: {
                OR: [
                    { title: { contains: capped, mode: "insensitive" } },
                    { description: { contains: capped, mode: "insensitive" } },
                    { content: { contains: capped, mode: "insensitive" } },
                ],
            },
        }
    );

    assert.deepEqual(getFilterWhere({ isFavorite: true }), {
        isRead: undefined,
        isBookmarked: undefined,
        isFavorite: true,
    });
});
