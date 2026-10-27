import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

process.env.DATABASE_URL ??= "postgresql://localhost:5432/unused";

test("filter bar renders a search field and a clear button when the query is set", async () => {
    const { FilterBar } = await import("../src/components/table/table-filter-bar");
    const withQuery = renderToStaticMarkup(
        createElement(FilterBar, {
            filters: {
                search: "needle",
                setSearch: () => {},
                clearSearch: () => {},
            },
            actions: {
                subscribe: async () => {},
            },
            title: "Preview",
            isSubscribed: false,
            feed: {
                internalIdentifier: "preview-feed",
                imageUrl: null,
            } as never,
        })
    );
    assert.match(withQuery, /aria-label="Search articles"/);
    assert.match(withQuery, /value="needle"/);
    assert.match(withQuery, /aria-label="Clear search"/);
    assert.match(withQuery, /placeholder="Search articles"/);

    const empty = renderToStaticMarkup(
        createElement(FilterBar, {
            filters: {
                search: "",
                setSearch: () => {},
                clearSearch: () => {},
                showUnreadOnly: false,
                toggleShowUnreadOnly: () => {},
                currentTableType: "list",
                hasReadAll: false,
            },
            actions: {
                markAllAsRead: () => {},
                subscribe: async () => {},
                refresh: async () => {},
                selectTableType: () => {},
            },
            title: "All",
            isSubscribed: true,
        })
    );
    assert.match(empty, /aria-label="Search articles"/);
    assert.equal(empty.includes("Clear search"), false);
    assert.match(empty, />All</);
});
