import { sortItems } from "@/client/lib/utils";
import createLogger from "@/server/lib/logger";
import { ItemRepository } from "@/server/repositories/ItemRespository";
import { AsyncResultType, Result } from "@/shared/models/result";
import { ItemWithContent, ItemWithContentAndFeed } from "@/shared/models/types";

const logger = createLogger("ItemService");

const getAllItemsByUserId = async (userId: number): AsyncResultType<ItemWithContentAndFeed[]> => {
    const items = await ItemRepository.getAllItemsByUserId(userId);

    if (!items.success) {
        logger.error(`Could not find items for user with id ${userId}`);
        return Result.error(`Could not find items for user with id ${userId}`, "NotFound");
    }

    return Result.ok(sortItems(items.data));
};

const markAsRead = async (id: number, markAsRead: boolean) => {
    const item = await ItemRepository.getItemById(id);

    if (!item.success) {
        logger.error(`Could not find item with id ${id}`);
        return Result.error(`Could not find item with id ${id}`, "NotFound");
    }

    const updated = await ItemRepository.updateItem(id, {
        ...item.data,
        isRead: markAsRead,
    });

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

const updateItem = async (item: ItemWithContent) => {
    const existingItem = await ItemRepository.getItemById(item.id);

    if (!existingItem.success) {
        logger.error(`Could not find item with id ${item.id}`);
        return Result.error(`Could not find item with id ${item.id}`, "NotFound");
    }

    const updatedItem: ItemWithContent = { ...existingItem.data, ...item };

    const updated = await ItemRepository.updateItem(item.id, updatedItem);

    if (!updated.success) {
        logger.error(`Could not update item with id ${item.id}`);
        return Result.error(`Could not update item with id ${item.id}`, "InternalError");
    }

    return Result.ok(updated.data);
};

const markItemsAsRead = async (ids: number[]) => {
    const res = await ItemRepository.markItemsAsRead(ids);

    if (!res.success) {
        logger.error(`Could not mark items as read`);
        return Result.error(`Could not mark items as read`, "InternalError");
    }

    return Result.okEmpty();
};

export const ItemService = {
    markAsRead,
    getItemById,
    updateItem,
    markItemsAsRead,
    getAllItemsByUserId,
};
