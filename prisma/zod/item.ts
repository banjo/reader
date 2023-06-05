import * as z from "zod";
import {
    CompleteFeed,
    CompleteTag,
    CompleteUser,
    RelatedFeedModel,
    RelatedTagModel,
    RelatedUserModel,
} from "./index";

export const ItemModel = z.object({
    id: z.number().int(),
    feedId: z.number().int(),
    userId: z.number().int(),
    hasRead: z.boolean(),
    hasBookmarked: z.boolean(),
    title: z.string(),
    link: z.string(),
    content: z.string(),
    html: z.string(),
    lastFetch: z.date(),
    pubDate: z.date(),
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
