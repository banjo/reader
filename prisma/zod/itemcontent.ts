import * as z from "zod";
import { CompleteItem, RelatedItemModel, CompleteFeed, RelatedFeedModel } from "./index";

export const ItemContentModel = z.object({
    id: z.number().int(),
    feedId: z.number().int(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    imageUrl: z.union([z.string(), z.null()]),
    title: z.string(),
    description: z.union([z.string(), z.null()]),
    link: z.string(),
    content: z.union([z.string(), z.null()]),
    htmlContent: z.union([z.string(), z.null()]),
    lastFetch: z.coerce.date(),
    pubDate: z.coerce.date(),
});

export interface CompleteItemContent extends z.infer<typeof ItemContentModel> {
    items: CompleteItem[];
    feed: CompleteFeed;
}

/**
 * RelatedItemContentModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedItemContentModel: z.ZodSchema<CompleteItemContent> = z.lazy(() =>
    ItemContentModel.extend({
        items: RelatedItemModel.array(),
        feed: RelatedFeedModel,
    })
);
