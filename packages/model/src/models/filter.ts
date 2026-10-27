import { z } from "zod";

export const articleSearchMaxLength = 100;

/** Trim, drop empty input, and cap article search text before it hits the database. */
export const normalizeArticleSearch = (value: string | undefined | null): string | undefined => {
    if (!value) {
        return undefined;
    }

    const trimmed = value.trim().slice(0, articleSearchMaxLength);
    return trimmed.length > 0 ? trimmed : undefined;
};

const articleSearchSchema = z
    .string()
    .optional()
    .transform(value => normalizeArticleSearch(value));

export const filterSchema = z.object({
    isRead: z.boolean().optional(),
    isFavorite: z.boolean().optional(),
    isBookmarked: z.boolean().optional(),
    search: articleSearchSchema,
});

export type Filter = {
    isRead?: boolean;
    isFavorite?: boolean;
    isBookmarked?: boolean;
    search?: string;
};
