import createLogger from "@/server/lib/logger";
import { ItemRepository } from "@/server/repositories/ItemRespository";
import { CleanItem } from "@/shared/models/entities";
import { Result } from "@/shared/models/result";

const logger = createLogger("ItemService");

const markAsRead = async (id: number, markAsRead: boolean) => {
    const item = await ItemRepository.getItemById(id);

    if (!item.success) {
        logger.error(`Could not find item with id ${id}`);
        return Result.error(`Could not find item with id ${id}`, "NotFound");
    }

    const updated = await ItemRepository.updateItem({ ...item.data, isRead: markAsRead });

    if (!updated.success) {
        logger.error(`Could not update item with id ${id}`);
        return Result.error(`Could not update item with id ${id}`, "InternalError");
    }

    return Result.ok(updated.data);
};

const getItemById = async (id: number) => {
    const item = await ItemRepository.getItemById(id);

    if (!item.success) {
        logger.error(`Could not find item with id ${id}`);
        return Result.error(`Could not find item with id ${id}`, "NotFound");
    }

    return Result.ok(item.data);
};

const updateItem = async (item: CleanItem) => {
    const existingItem = await ItemRepository.getItemById(item.id);

    if (!existingItem.success) {
        logger.error(`Could not find item with id ${item.id}`);
        return Result.error(`Could not find item with id ${item.id}`, "NotFound");
    }

    const updatedItem = { ...existingItem.data, ...item };

    const updated = await ItemRepository.updateItem(updatedItem);

    if (!updated.success) {
        logger.error(`Could not update item with id ${item.id}`);
        return Result.error(`Could not update item with id ${item.id}`, "InternalError");
    }

    return Result.ok(updated.data);
};

export const ItemService = { markAsRead, getItemById, updateItem };
