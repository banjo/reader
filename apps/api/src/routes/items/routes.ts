import { createHonoInstance } from "@app/instance";
import { zValidator } from "@hono/zod-validator";
import { ItemService } from "server";
import { createLogger, Result } from "utils";
import { z } from "zod";

export const items = createHonoInstance();
const logger = createLogger("api:items");

items.get("/", async c => {
    const userId = c.get("userId");

    const itemsResponse = await ItemService.getAllItemsByUserId(userId);

    if (!itemsResponse.success) {
        logger.error(`Could not fetch items for user ${userId}`);
        return c.json(Result.error(itemsResponse.message, itemsResponse.type));
    }

    return c.json(itemsResponse.data);
});

const itemsPostReadSchema = z.object({
    ids: z.array(z.number()),
});

items.post("/read", zValidator("json", itemsPostReadSchema), async c => {
    const body = await c.req.valid("json");

    const item = await ItemService.markItemsAsRead(body.ids);

    if (!item.success) {
        logger.error(`Could not mark items as read`);
        return c.json(Result.error(item.message, item.type));
    }

    return c.json(Result.okEmpty());
});
