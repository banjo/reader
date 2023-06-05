import { Feed, Item, User } from "@prisma/client";

type StrictOmitKeys<T, K extends keyof T> = {
    [P in keyof T]: P extends K ? never : P;
}[keyof T];

type StrictOmit<T, K extends keyof T> = {
    [P in StrictOmitKeys<T, K>]: T[P];
};

export type CleanFeed = StrictOmit<Feed, "ttl">;
export type CleanUser = StrictOmit<User, "externalId">;
export type CleanItem = StrictOmit<Item, "feedId" | "userId">;

export type FeedWithItems = Feed & { items?: Item[] };
export type CleanFeedWithItems = CleanFeed & { items?: CleanItem[] };
