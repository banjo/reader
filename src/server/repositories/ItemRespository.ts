import createLogger from "@/server/lib/logger";
import prisma from "@/server/repositories/prisma";
import {
    CreateItem,
    CreateItemContent,
    CreateItemWithContentId,
    UpdateItem,
} from "@/shared/models/entities";
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
            include: {
                content: true,
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
            include: {
                content: true,
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

const updateItem = async (item: UpdateItem): Promise<ResultType<Item>> => {
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

type CreateItemProps = {
    item: CreateItem;
    contentId: number;
    feedId: number;
    userId: number;
};

const createItem = async ({
    item,
    contentId,
    feedId,
    userId,
}: CreateItemProps): Promise<ResultType<Item>> => {
    try {
        const createdItem = await prisma.item.create({
            data: { ...item, feedId, userId, contentId },
        });

        return Result.ok(createdItem);
    } catch (error: unknown) {
        logger.error(`Could not create item - ${error}`);
        return Result.error(`Could not create item`, "InternalError");
    }
};

const createItems = async (
    itemsWithContentId: CreateItemWithContentId[],
    feedId: number,
    userId: number
) => {
    try {
        const createdItems = await prisma.item.createMany({
            data: itemsWithContentId.map(item => ({
                ...item,
                feedId,
                userId,
            })),
        });

        if (createdItems.count !== itemsWithContentId.length) {
            logger.error(`Could not create all items`);
            return Result.error(`Could not create all items`, "InternalError");
        }

        return Result.okEmpty();
    } catch (error: unknown) {
        logger.error(`Could not create items - ${error}`);
        return Result.error(`Could not create items`, "InternalError");
    }
};

const createItemsWithContentFromContent = async (
    content: CreateItemContent[],
    feedId: number,
    userId: number
): Promise<ResultType<void>> => {
    try {
        const createdContentResult = await prisma.itemContent.createMany({
            data: content,
        });

        if (createdContentResult.count !== content.length) {
            logger.error(`Could not create all content`);
            return Result.error(`Could not create all content`, "InternalError");
        }

        const createdContent = await prisma.itemContent.findMany({
            where: {
                feedId,
            },
        });

        const createdItems = await prisma.item.createMany({
            data: createdContent.map(itemContent => ({
                contentId: itemContent.id,
                feedId,
                userId,
                isBookmarked: false,
                isRead: false,
                isFavorite: false,
            })),
        });

        if (createdItems.count !== content.length) {
            logger.error(`Could not create all items`);
            return Result.error(`Could not create all items`, "InternalError");
        }

        return Result.okEmpty();
    } catch (error: unknown) {
        logger.error(`Could not create items - ${error}`);
        return Result.error(`Could not create items`, "InternalError");
    }
};

const removeFeedItemsForUser = async (
    feedId: number,
    userId: number
): Promise<ResultType<void>> => {
    try {
        await prisma.item.deleteMany({
            where: {
                feedId,
                userId,
            },
        });

        return Result.okEmpty();
    } catch (error: unknown) {
        logger.error(`Could not remove items for feed with id ${feedId} - ${error}`);
        return Result.error(`Could not remove items for feed with id ${feedId}`, "InternalError");
    }
};

export const ItemRepository = {
    getAllItemsByFeed,
    getItemById,
    markItemsAsRead,
    createItems,
    createItem,
    createItemsWithContentFromContent,
    updateItem,
    removeFeedItemsForUser,
};
