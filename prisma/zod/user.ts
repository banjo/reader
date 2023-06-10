import * as z from "zod";
import {
    CompleteFeed,
    RelatedFeedModel,
    CompleteItem,
    RelatedItemModel,
    CompleteTag,
    RelatedTagModel,
} from "./index";

export const UserModel = z.object({
    id: z.number().int(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    email: z.string(),
    name: z.union([z.string(), z.null()]),
    externalId: z.string(),
});

export interface CompleteUser extends z.infer<typeof UserModel> {
    feeds: CompleteFeed[];
    items: CompleteItem[];
    tags: CompleteTag[];
}

/**
 * RelatedUserModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedUserModel: z.ZodSchema<CompleteUser> = z.lazy(() =>
    UserModel.extend({
        feeds: RelatedFeedModel.array(),
        items: RelatedItemModel.array(),
        tags: RelatedTagModel.array(),
    })
);
