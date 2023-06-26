import { FeedModel, ItemContentModel, ItemModel, TagModel, UserModel } from "prisma/zod";
import { z } from "zod";

// TODO: refactor to own files

// COMPLETE OBJECTS
export const CompleteItemSchema = ItemModel.extend({
    content: ItemContentModel,
    user: UserModel.optional(),
    feed: FeedModel.optional(),
    tag: TagModel.optional(),
});

export const CompleteFeedSchema = FeedModel.extend({
    items: ItemModel.array(),
});

export type CompleteItem = z.TypeOf<typeof CompleteItemSchema>;
export type CompleteFeed = z.TypeOf<typeof CompleteFeedSchema>;

// CLEAN OBJECTS (for frontend)
export const CleanItemSchema = ItemModel.omit({
    feedId: true,
    userId: true,
    contentId: true,
}).extend({
    content: ItemContentModel,
});

export const CleanFeedSchema = FeedModel.omit({
    ttl: true,
});

export const CleanUserSchema = UserModel.omit({
    externalId: true,
});

export const CleanContentSchema = ItemContentModel.omit({
    feedId: true,
});

export type CleanItem = z.TypeOf<typeof CleanItemSchema>;
export type CleanFeed = z.TypeOf<typeof CleanFeedSchema>;
export type CleanUser = z.TypeOf<typeof CleanUserSchema>;
export type CleanContent = z.TypeOf<typeof CleanContentSchema>;

// FEED WITH ITEMS INCLUDED
export const FeedWithUsersSchema = FeedModel.extend({
    users: UserModel.array(),
});

export const FeedWithItemsSchema = FeedModel.extend({
    items: CompleteItemSchema.array(),
});

export const CleanFeedWithItemsSchema = CleanFeedSchema.extend({
    items: CleanItemSchema.array(),
});

export type FeedWithUser = z.TypeOf<typeof FeedWithUsersSchema>;
export type FeedWithItems = z.TypeOf<typeof FeedWithItemsSchema>;
export type CleanFeedWithItems = z.TypeOf<typeof CleanFeedWithItemsSchema>;

// UPDATE OBJECTS (when updating existing objects)
export const UpdateItemSchema = ItemModel.omit({
    createdAt: true,
    updatedAt: true,
    feedId: true,
    contentId: true,
    userId: true,
});

export type UpdateItem = z.TypeOf<typeof UpdateItemSchema>;

// CREATE OBJECTS (when creating new objects)
export const CreateFeedSchema = FeedModel.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    users: true,
    internalIdentifier: true,
});

export type CreateFeed = z.TypeOf<typeof CreateFeedSchema>;

export const CreateItemSchema = ItemModel.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    feedId: true,
    contentId: true,
});

export type CreateItem = z.TypeOf<typeof CreateItemSchema>;

export const CreateItemWithContentIdSchema = CreateItemSchema.extend({
    contentId: z.number(),
});

export type CreateItemWithContentId = z.TypeOf<typeof CreateItemWithContentIdSchema>;

export const CreateItemContentSchema = ItemContentModel.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export type CreateItemContent = z.TypeOf<typeof CreateItemContentSchema>;

// SEARCH OBJECTS (returned when searching)
export const SearchFeedSchema = FeedModel.pick({
    name: true,
    rssUrl: true,
    description: true,
    imageUrl: true,
    url: true,
    internalIdentifier: true,
});

export type SearchFeed = z.TypeOf<typeof SearchFeedSchema>;
