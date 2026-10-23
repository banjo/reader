import { createHonoInstance } from "@app/instance";
import { zValidator } from "@hono/zod-validator";
import { ItemService } from "server";
import { createLogger, Result } from "utils";
import { z } from "zod";

export const item = createHonoInstance();
const logger = createLogger("api:item");

const itemIdSchema = z.object({
    id: z
        .string()
        .regex(/^\d+$/)
        .transform(id => Number(id)),
});

const itemStatusSchema = z.object({
    isRead: z.boolean().optional(),
    isBookmarked: z.boolean().optional(),
    isFavorite: z.boolean().optional(),
});

item.put(
    "/:id",
    zValidator("param", itemIdSchema),
    zValidator("json", itemStatusSchema),
    async c => {
        const userId = c.get("userId");
        const { id } = c.req.valid("param");
        const status = c.req.valid("json");

        const itemResult = await ItemService.updateItemStatus(id, userId, status);

        if (!itemResult.success) {
            logger.error(`Could not update item with id ${id} for user ${userId}`);
            return c.json(Result.error(itemResult.message, itemResult.type));
        }

        return c.json(Result.okEmpty());
    }
);
