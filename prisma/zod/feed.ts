import * as z from "zod";
import { CompleteItem, RelatedItemModel, CompleteUser, RelatedUserModel } from "./index";

export const FeedModel = z.object({
    id: z.number().int(),
    createdAt: z.date(),
    updatedAt: z.date(),
    name: z.string(),
    url: z.string(),
    rssUrl: z.string(),
    description: z.union([z.string(), z.null()]),
    imageUrl: z.union([z.string(), z.null()]),
    internalIdentifier: z.string(),
    ttl: z.number().int().nullish(),
});

export interface CompleteFeed extends z.infer<typeof FeedModel> {
    items: CompleteItem[];
    users: CompleteUser[];
}

/**
 * RelatedFeedModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedFeedModel: z.ZodSchema<CompleteFeed> = z.lazy(() =>
    FeedModel.extend({
        items: RelatedItemModel.array(),
        users: RelatedUserModel.array(),
    })
);
