import * as z from "zod";
import { CompleteItem, CompleteUser, RelatedItemModel, RelatedUserModel } from "./index";

export const TagModel = z.object({
    id: z.number().int(),
    createdAt: z.date(),
    updatedAt: z.date(),
    name: z.string(),
    userId: z.number().int(),
});

export interface CompleteTag extends z.infer<typeof TagModel> {
    user: CompleteUser;
    items: CompleteItem[];
}

/**
 * RelatedTagModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedTagModel: z.ZodSchema<CompleteTag> = z.lazy(() =>
    TagModel.extend({
        user: RelatedUserModel,
        items: RelatedItemModel.array(),
    })
);
