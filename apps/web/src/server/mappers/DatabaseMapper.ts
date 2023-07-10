import { CleanFeedWithContent, CleanFeedWithItems, FeedWithContent, FeedWithItems } from "db";

function feedWithItems(feed: FeedWithItems): CleanFeedWithItems {
    return {
        ...feed,
        isSubscribed: true,
    };
}

function feedsWithItems(feeds: FeedWithItems[]): CleanFeedWithItems[] {
    return feeds.map(element => feedWithItems(element));
}

function feedWithContent(feed: FeedWithContent): CleanFeedWithContent {
    return {
        ...feed,
        isSubscribed: false,
    };
}

function feedsWithContent(feeds: FeedWithContent[]): CleanFeedWithContent[] {
    return feeds.map(element => feedWithContent(element));
}

export const DatabaseMapper = {
    feedWithItems,
    feedsWithItems,
    feedWithContent,
    feedsWithContent,
};
