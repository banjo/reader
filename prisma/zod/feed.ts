import * as z from "zod";
import * as imports from "../null";
import { CompleteItem, RelatedItemModel, CompleteUser, RelatedUserModel } from "./index";

export const FeedModel = z.object({
    id: z.number().int(),
    createdAt: z.date(),
    updatedAt: z.date(),
    name: z.string(),
    link: z.string(),
    imageUrl: z.string().nullish(),
    publicUrl: z.string(),
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
