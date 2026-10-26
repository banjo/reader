import type { ParseItem } from "../../services/ParseService";

type SelectNewFeedItemsProps = {
    items: ParseItem[];
    currentLinks: Set<string>;
};

export const initialFeedItemLimit = 200;

const newestFirst = (items: ParseItem[]) =>
    [...items].sort(
        (a, b) => (b.pubDate ? Date.parse(b.pubDate) : 0) - (a.pubDate ? Date.parse(a.pubDate) : 0)
    );

const selectInitialFeedItems = (items: ParseItem[]) =>
    newestFirst(items).slice(0, initialFeedItemLimit);

const selectNewFeedItems = ({ items, currentLinks }: SelectNewFeedItemsProps) => {
    let candidates = newestFirst(items);

    if (currentLinks.size === 0) {
        return candidates.slice(0, initialFeedItemLimit);
    }

    // Do not backfill the history intentionally skipped by the initial import.
    if (currentLinks.size >= initialFeedItemLimit && candidates.length > initialFeedItemLimit) {
        let lastKnownIndex = -1;
        for (let index = candidates.length - 1; index >= 0; index--) {
            const item = candidates[index];
            if (item && currentLinks.has(item.link)) {
                lastKnownIndex = index;
                break;
            }
        }
        const end = lastKnownIndex === -1 ? initialFeedItemLimit : lastKnownIndex + 1;
        candidates = candidates.slice(0, end);
    }

    return candidates.filter(item => !currentLinks.has(item.link));
};

export const FeedRefresh = { selectInitialFeedItems, selectNewFeedItems };
