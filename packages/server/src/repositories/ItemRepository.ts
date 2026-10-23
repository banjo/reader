import { Item, ItemContent, ItemWithContent, ItemWithContentAndFeed, Prisma, prisma } from "db";
import { AsyncResultType, Filter, Pagination } from "model";
import { Result, createLogger } from "utils";
import { getFilterWhere, getPagination } from "../shared/lib/utils";

const logger = createLogger("ItemRepository");

const getAllItemsByFeed = async (feedId: number): AsyncResultType<ItemWithContent[]> => {
    let items: ItemWithContent[];
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

const getAllItemsByUserId = async (
    userId: number,
    pagination: Pagination,
    filter: Filter
): AsyncResultType<ItemWithContentAndFeed[]> => {
    let items: ItemWithContentAndFeed[];

    try {
        items = await prisma.item.findMany({
            where: {
                userId: userId,
                ...getFilterWhere(filter),
            },
            include: {
                content: true,
                feed: true,
            },
            orderBy: {
                content: {
                    pubDate: "desc",
                },
            },
            ...getPagination(pagination),
        });
    } catch (error: unknown) {
        logger.error(`Could not find items for user with id ${userId} - ${error}`);
        return Result.error(`Could not find items for user with id ${userId}`, "InternalError");
    }

    return Result.ok(items);
};

const getItemById = async (itemId: number): AsyncResultType<ItemWithContent> => {
    let item: ItemWithContent | null;
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

export type ItemStatus = {
    isRead?: boolean;
    isBookmarked?: boolean;
    isFavorite?: boolean;
};

const updateItemStatus = async (
    id: number,
    userId: number,
    status: ItemStatus
): AsyncResultType<void> => {
    let count: number;
    try {
        const result = await prisma.item.updateMany({
            where: {
                id,
                userId,
            },
            data: status,
        });

        count = result.count;
    } catch (error: unknown) {
        logger.error(`Could not update item with id ${id} - ${error}`);
        return Result.error(`Could not update item with id ${id}`, "InternalError");
    }

    if (count === 0) {
        logger.info(`Could not find item with id ${id} for user ${userId}`);
        return Result.error(`Could not find item with id ${id}`, "NotFound");
    }

    return Result.okEmpty();
};

const markItemsAsRead = async (itemIds: number[], userId: number): AsyncResultType<void> => {
    try {
        await prisma.item.updateMany({
            where: {
                id: {
                    in: itemIds,
                },
                userId,
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
    item: Prisma.ItemCreateManyInput;
    contentId: number;
    feedId: number;
    userId: number;
};

// TODO: update create item to accomodate for content
const createItem = async ({ item }: CreateItemProps): AsyncResultType<Item> => {
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

const createItems = async (items: Prisma.ItemCreateManyInput[]) => {
    try {
        const createdItems = await prisma.item.createMany({
            data: items,
        });

        if (createdItems.count !== items.length) {
            logger.error(`Could not create all items`);
            return Result.error(`Could not create all items`, "InternalError");
        }

        return Result.okEmpty();
    } catch (error: unknown) {
        logger.error(`Could not create items - ${error}`);
        return Result.error(`Could not create items`, "InternalError");
    }
};

const createContent = async (
    content: Prisma.ItemContentCreateManyFeedInput[],
    feedId: number
): AsyncResultType<ItemContent[]> => {
    try {
        const createdContentResult = await prisma.itemContent.createMany({
            data: content.map(itemContent => ({
                ...itemContent,
                feedId,
            })),
            skipDuplicates: true,
        });

        if (createdContentResult.count !== content.length) {
            logger.error(`Could not create all content`);
            return Result.error(`Could not create all content`, "InternalError");
        }

        // fetch only the created content as prisma do not return ids for createMany
        const createdContent = await prisma.itemContent.findMany({
            where: {
                feedId,
                title: {
                    in: content.map(itemContent => itemContent.title),
                },
                link: {
                    in: content.map(itemContent => itemContent.link),
                },
            },
        });

        return Result.ok(createdContent);
    } catch (error: unknown) {
        logger.error(`Could not create content - ${error}`);
        return Result.error(`Could not create content`, "InternalError");
    }
};

const createItemsFromContent = async (
    content: ItemContent[],
    feedId: number,
    userId: number
): AsyncResultType<void> => {
    try {
        const createdItems = await prisma.item.createMany({
            data: content.map(itemContent => ({
                contentId: itemContent.id,
                feedId,
                userId,
                isBookmarked: false,
                isRead: false,
                isFavorite: false,
            })),
            skipDuplicates: true,
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

const removeFeedItemsForUser = async (feedId: number, userId: number): AsyncResultType<void> => {
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

const getItemCount = async (userId: number, filter: Filter): AsyncResultType<number> => {
    let count: number;

    try {
        count = await prisma.item.count({
            where: {
                userId: userId,
                ...getFilterWhere(filter),
            },
        });
    } catch (error: unknown) {
        logger.error(`Could not count items for user with id ${userId} - ${error}`);
        return Result.error(`Could not count items for user with id ${userId}`, "InternalError");
    }

    return Result.ok(count);
};

export const ItemRepository = {
    getAllItemsByFeed,
    getItemById,
    markItemsAsRead,
    createItems,
    createItem,
    createItemsFromContent,
    updateItemStatus,
    removeFeedItemsForUser,
    getAllItemsByUserId,
    createContent,
    getItemCount,
};
