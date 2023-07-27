import { createHonoInstance } from "@app/instance";
import { zValidator } from "@hono/zod-validator";
import { ItemService } from "server";
import { createLogger, Result } from "utils";
import { z } from "zod";

export const item = createHonoInstance();
const logger = createLogger("api:item");

const itemIdSchema = z.object({
    id: z.string(),
});

item.put("/:id", zValidator("param", itemIdSchema), async c => {
    const { id } = c.req.valid("param");

    const body = await c.req.json();

    const itemResult = await ItemService.updateItem(body);

    if (!itemResult.success) {
        logger.error(`Could not update item with internal identifier ${id}`);
        return c.json(Result.error(itemResult.message, itemResult.type));
    }

    return c.json(Result.okEmpty());
});
