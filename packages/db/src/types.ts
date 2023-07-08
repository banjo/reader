import { Feed, Item, ItemContent, User } from "@prisma/client";

export type ItemWithContent = Item & {
    content: ItemContent;
};

export type ItemWithContentAndFeed = ItemWithContent & {
    feed: Feed;
};

export type FeedWithItems = Feed & {
    items: ItemWithContent[];
};

export type FeedWithUsers = Feed & {
    users: User[];
};

export type FeedWithUsersAndItems = FeedWithUsers & FeedWithItems;

export type FeedWithContent = Feed & {
    contentItems: ItemContent[];
};

export type CleanFeedWithContent = FeedWithContent & {
    isSubscribed: false;
};

export type CleanFeedWithItems = FeedWithItems & {
    isSubscribed: true;
};
