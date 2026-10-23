import { createHonoInstance } from "@app/instance";
import { zValidator } from "@hono/zod-validator";
import { ItemService } from "server";
import { createLogger, Result } from "utils";
import { z } from "zod";

export const item = createHonoInstance();
const logger = createLogger("api:item");

const itemIdSchema = z.coerce.number().int().positive();

const itemStatusSchema = z.object({
    isRead: z.boolean().optional(),
    isBookmarked: z.boolean().optional(),
    isFavorite: z.boolean().optional(),
});

item.put("/:id", zValidator("json", itemStatusSchema), async c => {
    const userId = c.get("userId");
    const status = c.req.valid("json");
    const idResult = itemIdSchema.safeParse(c.req.param("id"));

    if (!idResult.success) {
        return c.json(Result.error("Invalid item id", "BadRequest"), 400);
    }

    const id = idResult.data;
    const itemResult = await ItemService.updateItemStatus(id, userId, status);

    if (!itemResult.success) {
        logger.error(`Could not update item with id ${id} for user ${userId}`);
        return c.json(Result.error(itemResult.message, itemResult.type));
    }

    return c.json(Result.okEmpty());
});
