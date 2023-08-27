import { z } from "zod";

export const filterSchema = z.object({
    isRead: z.boolean().optional(),
    isFavorite: z.boolean().optional(),
    isBookmarked: z.boolean().optional(),
});

export type Filter = z.infer<typeof filterSchema>;
