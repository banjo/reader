import assert from "node:assert/strict";
import { test } from "node:test";
import { QueryClient, QueryClientProvider, QueryObserver } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { feedsQueryKey, itemCountsQueryKey } from "../src/hooks/backend/query-keys";
import { useInvalidate } from "../src/hooks/backend/use-invalidate";

test("feed counts refresh deliberately, independently of item query refetches", async t => {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Infinity, cacheTime: 0 } },
    });
    const itemsQueryKey = ["items", "page", 1];
    client.setQueryData(feedsQueryKey, []);
    client.setQueryData(itemsQueryKey, []);
    client.setQueryData(itemCountsQueryKey, {});
    let feedFetches = 0;
    let itemFetches = 0;
    let countFetches = 0;
    const counts = new QueryObserver(client, {
        queryKey: itemCountsQueryKey,
        queryFn: async () => {
            countFetches++;
            return {};
        },
    });
    const feeds = new QueryObserver(client, {
        queryKey: feedsQueryKey,
        queryFn: async () => {
            feedFetches++;
            return [];
        },
    });
    const items = new QueryObserver(client, {
        queryKey: itemsQueryKey,
        queryFn: async () => {
            itemFetches++;
            return [];
        },
    });
    const unsubscribeFeeds = feeds.subscribe(() => {});
    const unsubscribeItems = items.subscribe(() => {});
    const unsubscribeCounts = counts.subscribe(() => {});
    t.after(() => {
        unsubscribeFeeds();
        unsubscribeItems();
        unsubscribeCounts();
        client.clear();
    });

    let actions: ReturnType<typeof useInvalidate> | undefined;
    const Capture = () => {
        actions = useInvalidate();
        return null;
    };
    renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Capture)));
    assert.ok(actions);
    assert.equal(feedFetches, 0);

    await actions.refetch();
    assert.equal(itemFetches, 1);
    assert.equal(feedFetches, 0);
    assert.equal(countFetches, 0);

    await actions.invalidateFeeds();
    assert.equal(itemFetches, 1);
    assert.equal(feedFetches, 1);
    assert.equal(countFetches, 1);

    await actions.invalidate();
    assert.equal(itemFetches, 2);
    assert.equal(feedFetches, 2);
    assert.equal(countFetches, 2);

    await client.invalidateQueries({ queryKey: ["items"] });
    assert.equal(itemFetches, 3);
    assert.equal(feedFetches, 2);

    actions.clear();
    assert.equal(client.getQueryData(feedsQueryKey), undefined);
    assert.equal(client.getQueryData(itemsQueryKey), undefined);
    assert.equal(client.getQueryData(itemCountsQueryKey), undefined);
});
