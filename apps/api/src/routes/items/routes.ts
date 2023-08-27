import { createHonoInstance } from "@app/instance";
import { parseFilters, parsePagination } from "@app/utils";
import { zValidator } from "@hono/zod-validator";
import { PaginationResponse } from "model";
import { ItemService } from "server";
import { Result, createLogger } from "utils";
import { z } from "zod";

export const items = createHonoInstance();
const logger = createLogger("api:items");

items.get("/", async c => {
    const userId = c.get("userId");
    const pagination = parsePagination(c);
    const filters = parseFilters(c);

    // TODO: add promise.all here
    const itemsResponse = await ItemService.getAllItemsByUserId(userId, pagination, filters);

    if (!itemsResponse.success) {
        logger.error(`Could not fetch items for user ${userId}`);
        return c.json(Result.error(itemsResponse.message, itemsResponse.type));
    }

    const totalItemsCount = await ItemService.getItemCount(userId, filters);

    if (!totalItemsCount.success) {
        logger.error(`Could not fetch items count for user ${userId}`);
        return c.json(Result.error(totalItemsCount.message, totalItemsCount.type));
    }

    const paginationResponse = PaginationResponse.from(
        pagination,
        totalItemsCount.data,
        itemsResponse.data
    );

    return c.json(Result.ok(paginationResponse));
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
