import * as z from "zod";
import { CompleteItem, RelatedItemModel, CompleteUser, RelatedUserModel } from "./index";

export const FeedModel = z.object({
    id: z.number().int(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    name: z.string(),
    url: z.string(),
    rssUrl: z.string(),
    description: z.string().nullish(),
    imageUrl: z.string().nullish(),
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
