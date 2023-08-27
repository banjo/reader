import { createHonoInstance } from "@app/instance";
import { zValidator } from "@hono/zod-validator";
import { Filter, Pagination, PaginationResponse } from "model";
import { ItemService } from "server";
import { Result, createLogger } from "utils";
import { z } from "zod";

export const items = createHonoInstance();
const logger = createLogger("api:items");

items.get("/", async c => {
    const userId = c.get("userId");
    const queryParams = c.req.query();

    const pagination: Pagination = {
        page: queryParams.page ? Number.parseInt(queryParams.page as string) : 1,
        pageSize: queryParams.pageSize ? Number.parseInt(queryParams.pageSize as string) : 12,
    };

    const filters: Filter = {
        isRead: queryParams.isRead ? queryParams.isRead === "true" : undefined,
        isBookmarked: queryParams.isBookmarked ? queryParams.isBookmarked === "true" : undefined,
        isFavorite: queryParams.isFavorite ? queryParams.isFavorite === "true" : undefined,
    };

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
