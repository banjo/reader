import * as z from "zod";
import {
    CompleteFeed,
    RelatedFeedModel,
    CompleteUser,
    RelatedUserModel,
    CompleteItemContent,
    RelatedItemContentModel,
    CompleteTag,
    RelatedTagModel,
} from "./index";

export const ItemModel = z.object({
    id: z.number().int(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    feedId: z.number().int(),
    userId: z.number().int(),
    contentId: z.number().int(),
    isRead: z.boolean(),
    isBookmarked: z.boolean(),
    isFavorite: z.boolean(),
});

export interface CompleteItem extends z.infer<typeof ItemModel> {
    feed: CompleteFeed;
    user: CompleteUser;
    content: CompleteItemContent;
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
        content: RelatedItemContentModel,
        tags: RelatedTagModel.array(),
    })
);
