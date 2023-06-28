import createLogger from "@/server/lib/logger";
import { DatabaseMapper } from "@/server/mappers/DatabaseMapper";
import { ItemMapper } from "@/server/mappers/ItemMapper";
import { ItemRepository } from "@/server/repositories/ItemRespository";
import { CleanItem } from "@/shared/models/entities";
import { Result, ResultType } from "@/shared/models/result";

const logger = createLogger("ItemService");

const getAllItemsByUserId = async (userId: number): Promise<ResultType<CleanItem[]>> => {
    const items = await ItemRepository.getAllItemsByUserId(userId);

    if (!items.success) {
        logger.error(`Could not find items for user with id ${userId}`);
        return Result.error(`Could not find items for user with id ${userId}`, "NotFound");
    }

    return Result.ok(DatabaseMapper.items(items.data));
};

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

    const updatedItem: CleanItem = { ...existingItem.data, ...item };

    const updated = await ItemRepository.updateItem(ItemMapper.cleanItemToUpdateItem(updatedItem));

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
