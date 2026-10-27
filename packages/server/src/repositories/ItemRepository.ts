import { ItemWithContent, ItemWithContentAndFeed, Prisma, prisma } from "db";
import { AsyncResultType, Filter, ItemUnreadCounts, Pagination } from "model";
import { Result, createLogger } from "utils";
import { getFilterWhere, getPagination, itemOrderBy } from "../shared/lib/utils";

const logger = createLogger("ItemRepository");

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
            orderBy: itemOrderBy,
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

type AssignFeedItemsToUserProps = {
    feedId: number;
    userId: number;
};

type AssignContentToFollowersProps = {
    feedId: number;
    contentIds: number[];
};

const assignContentToFollowers = async ({
    feedId,
    contentIds,
}: AssignContentToFollowersProps): AsyncResultType<void> => {
    if (contentIds.length === 0) {
        return Result.okEmpty();
    }

    try {
        await prisma.$executeRaw`
            INSERT INTO "Item" ("updatedAt", "feedId", "userId", "contentId")
            SELECT CURRENT_TIMESTAMP, followers."A", followers."B", content."id"
            FROM "_FeedToUser" AS followers
            JOIN "ItemContent" AS content ON content."feedId" = followers."A"
            WHERE followers."A" = ${feedId}
              AND content."id" IN (${Prisma.join(contentIds)})
            ON CONFLICT ("userId", "contentId") DO NOTHING
        `;
    } catch (error: unknown) {
        logger.error(`Could not assign content to followers of feed ${feedId} - ${error}`);
        return Result.error("Could not assign content to feed followers", "InternalError");
    }

    return Result.okEmpty();
};

const assignFeedItemsToUser = async ({
    feedId,
    userId,
}: AssignFeedItemsToUserProps): AsyncResultType<void> => {
    try {
        await prisma.$executeRaw`
            INSERT INTO "Item" ("updatedAt", "feedId", "userId", "contentId")
            SELECT CURRENT_TIMESTAMP, ${feedId}, ${userId}, "id"
            FROM "ItemContent"
            WHERE "feedId" = ${feedId}
            ON CONFLICT ("userId", "contentId") DO NOTHING
        `;
    } catch (error: unknown) {
        logger.error(`Could not assign feed ${feedId} to user ${userId} - ${error}`);
        return Result.error("Could not assign feed items to user", "InternalError");
    }

    return Result.okEmpty();
};

const insertContent = (content: Prisma.ItemContentCreateManyFeedInput[], feedId: number) =>
    prisma.itemContent.createMany({
        data: content.map(itemContent => ({ ...itemContent, feedId })),
        skipDuplicates: true,
    });

const createContentIds = async (
    content: Prisma.ItemContentCreateManyFeedInput[],
    feedId: number
): AsyncResultType<number[]> => {
    try {
        await insertContent(content, feedId);
        const saved = await prisma.itemContent.findMany({
            where: { feedId, link: { in: content.map(item => item.link) } },
            select: { id: true },
        });
        return Result.ok(saved.map(item => item.id));
    } catch (error: unknown) {
        logger.error(`Could not create content for feed ${feedId} - ${error}`);
        return Result.error("Could not create content", "InternalError");
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

const getUnreadCounts = async (userId: number): AsyncResultType<ItemUnreadCounts> => {
    try {
        const [counts] = await prisma.$queryRaw<
            {
                totalUnread: bigint;
                bookmarksUnread: bigint;
                favoritesUnread: bigint;
            }[]
        >`
            SELECT count(*) AS "totalUnread",
                   count(*) FILTER (WHERE "isBookmarked") AS "bookmarksUnread",
                   count(*) FILTER (WHERE "isFavorite") AS "favoritesUnread"
            FROM "Item"
            WHERE "userId" = ${userId} AND NOT "isRead"
        `;

        return Result.ok({
            totalUnread: Number(counts?.totalUnread ?? 0),
            bookmarksUnread: Number(counts?.bookmarksUnread ?? 0),
            favoritesUnread: Number(counts?.favoritesUnread ?? 0),
        });
    } catch (error: unknown) {
        logger.error({ err: error, userId }, "Could not count unread items");
        return Result.error("Could not count unread items", "InternalError");
    }
};

export const ItemRepository = {
    getUnreadCounts,
    assignContentToFollowers,
    assignFeedItemsToUser,
    getItemById,
    markItemsAsRead,
    updateItemStatus,
    getAllItemsByUserId,
    createContentIds,
    getItemCount,
};
