import * as z from "zod";
import {
    CompleteFeed,
    RelatedFeedModel,
    CompleteUser,
    RelatedUserModel,
    CompleteTag,
    RelatedTagModel,
} from "./index";

export const ItemModel = z.object({
    id: z.number().int(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    feedId: z.number().int(),
    userId: z.number().int(),
    isRead: z.boolean(),
    isBookmarked: z.boolean(),
    isFavorite: z.boolean(),
    image: z.string().nullish(),
    title: z.string(),
    description: z.string(),
    link: z.string(),
    content: z.string(),
    html: z.string(),
    lastFetch: z.coerce.date(),
    pubDate: z.coerce.date(),
});

export interface CompleteItem extends z.infer<typeof ItemModel> {
    feed: CompleteFeed;
    user: CompleteUser;
    tags: CompleteTag[];
}

/**
 * RelatedItemModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedItemModel: z.ZodSchema<CompleteItem> = z.lazy(() =>
    ItemModel.extend({
        feed: RelatedFeedModel,
        user: RelatedUserModel,
        tags: RelatedTagModel.array(),
    })
);
