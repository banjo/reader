import { FeedModel, ItemModel, UserModel } from "prisma/zod";
import { z } from "zod";

// create schema from generated prisma models and replace date with better option
export const CleanItemSchema = ItemModel.omit({
    feedId: true,
    userId: true,
});

export const CleanFeedSchema = FeedModel.omit({
    ttl: true,
});

export const CleanUserSchema = UserModel.omit({
    externalId: true,
});

export type CleanItem = z.TypeOf<typeof CleanItemSchema>;
export type CleanFeed = z.TypeOf<typeof CleanFeedSchema>;
export type CleanUser = z.TypeOf<typeof CleanUserSchema>;

export const FeedWithItemsSchema = FeedModel.extend({
    items: ItemModel.array(),
});

export const CleanFeedWithItemsSchema = CleanFeedSchema.extend({
    items: CleanItemSchema.array(),
});

export type FeedWithItems = z.TypeOf<typeof FeedWithItemsSchema>;
export type CleanFeedWithItems = z.TypeOf<typeof CleanFeedWithItemsSchema>;
