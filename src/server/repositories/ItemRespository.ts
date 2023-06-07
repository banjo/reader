import createLogger from "@/server/lib/logger";
import prisma from "@/server/repositories/prisma";
import { Result, ResultType } from "@/shared/models/result";
import { Item } from "@prisma/client";
import "server-only";

const logger = createLogger("ItemRepository");

const getAllItemsByFeed = async (feedId: number): Promise<ResultType<Item[]>> => {
    let items: Item[];
    try {
        items = await prisma.item.findMany({
            where: {
                feedId: feedId,
            },
        });
    } catch (error: unknown) {
        logger.error(`Could not find items for feed with id ${feedId} - ${error}`);
        return Result.error(`Could not find items for feed with id ${feedId}`, "InternalError");
    }

    return Result.ok(items);
};

const getItemById = async (itemId: number): Promise<ResultType<Item>> => {
    let item: Item | null;
    try {
        item = await prisma.item.findUnique({
            where: {
                id: itemId,
            },
        });
    } catch (error: unknown) {
        logger.error(`Could not find item with id ${itemId} - ${error}`);
        return Result.error(`Could not find item with id ${itemId}`, "InternalError");
    }

    if (!item) {
        logger.info(`Could not find item with id ${itemId}`);
        return Result.error(`Could not find item with id ${itemId}`, "NotFound");
    }

    return Result.ok(item);
};

const updateItem = async (item: Item): Promise<ResultType<Item>> => {
    let updatedItem: Item;
    try {
        updatedItem = await prisma.item.update({
            where: {
                id: item.id,
            },
            data: item,
        });
    } catch (error: unknown) {
        logger.error(`Could not update item with id ${item.id} - ${error}`);
        return Result.error(`Could not update item with id ${item.id}`, "InternalError");
    }

    return Result.ok(updatedItem);
};

const markItemsAsRead = async (itemIds: number[]): Promise<ResultType<void>> => {
    try {
        await prisma.item.updateMany({
            where: {
                id: {
                    in: itemIds,
                },
            },
            data: {
                isRead: true,
            },
        });
    } catch (error: unknown) {
        logger.error(`Could not mark items as read - ${error}`);
        return Result.error(`Could not mark items as read`, "InternalError");
    }

    return Result.okEmpty();
};

const createItem = async (item: Item): Promise<ResultType<Item>> => {
    try {
        const createdItem = await prisma.item.create({
            data: item,
        });

        return Result.ok(createdItem);
    } catch (error: unknown) {
        logger.error(`Could not create item - ${error}`);
        return Result.error(`Could not create item`, "InternalError");
    }
};

export const ItemRepository = {
    getAllItemsByFeed,
    getItemById,
    markItemsAsRead,
    createItem,
    updateItem,
};
