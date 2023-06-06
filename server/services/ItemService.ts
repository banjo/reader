import { Result } from "@/models/result";
import createLogger from "@/server/lib/logger";
import { ItemRepository } from "@/server/repositories/ItemRespository";

const logger = createLogger("ItemService");

const markAsRead = async (id: number) => {
    const item = await ItemRepository.getItemById(id);

    if (!item.success) {
        logger.error(`Could not find item with id ${id}`);
        return Result.error(`Could not find item with id ${id}`, "NotFound");
    }

    const updated = await ItemRepository.updateItem({ ...item.data, isRead: true });

    if (!updated.success) {
        logger.error(`Could not update item with id ${id}`);
        return Result.error(`Could not update item with id ${id}`, "InternalError");
    }

    return Result.ok(updated.data);
};

export const ItemService = { markAsRead };
