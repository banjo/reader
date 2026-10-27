import { Feed, FeedWithContent, FeedWithItems, Prisma, prisma } from "db";
import { AsyncResultType, feedSearchLimit, Filter, Pagination, SearchFeed } from "model";
import { Result, createLogger } from "utils";
import {
    contentOrderBy,
    getContentSearchWhere,
    getFilterWhere,
    getPagination,
    itemOrderBy,
} from "../shared/lib/utils";

const logger = createLogger("FeedRepository");

type FeedItemCounts = {
    feedId: number;
    total: bigint;
    unread: bigint;
    bookmarkedUnread: bigint;
    favoriteUnread: bigint;
};

export type FeedWithItemCounts = Feed & {
    totalItemsCount: number;
    totalItemsUnreadCount: number;
    bookmarkedItemsUnreadCount: number;
    favoriteItemsUnreadCount: number;
};

export type FeedItemsCountOptions = {
    internalIdentifier: string;
    userId: number;
    filter: Filter;
};

type FeedForRefresh = {
    id: number;
    rssUrl: string;
    contentItems: { link: string }[];
};

type SaveSubscriptionProps = {
    rssUrl: string;
    userId: number;
    feed?: Prisma.FeedCreateManyInput;
    content?: Prisma.ItemContentCreateManyFeedInput[];
};

type SearchFeedsProps = {
    query: string;
    userId: number;
};

const searchFeedSelect = {
    description: true,
    imageUrl: true,
    name: true,
    rssUrl: true,
    url: true,
    internalIdentifier: true,
} satisfies Prisma.FeedSelect;

const saveSubscription = async ({ rssUrl, userId, feed, content = [] }: SaveSubscriptionProps) => {
    return prisma.$transaction(async tx => {
        const created = feed
            ? await tx.feed.createMany({ data: [feed], skipDuplicates: true })
            : undefined;
        const saved = await tx.feed.findUniqueOrThrow({ where: { rssUrl }, select: { id: true } });
        await tx.feed.update({
            where: { id: saved.id },
            data: { users: { connect: { id: userId } } },
        });
        if (created?.count) {
            await tx.itemContent.createMany({
                data: content.map(item => ({ ...item, feedId: saved.id })),
                skipDuplicates: true,
            });
        }
        await tx.$executeRaw`
            INSERT INTO "Item" ("updatedAt", "feedId", "userId", "contentId")
            SELECT CURRENT_TIMESTAMP, ${saved.id}, ${userId}, "id"
            FROM "ItemContent"
            WHERE "feedId" = ${saved.id}
            ON CONFLICT ("userId", "contentId") DO NOTHING
        `;
        return saved.id;
    });
};

const getAllFeedsByUserId = async (userId: number): AsyncResultType<FeedWithItemCounts[]> => {
    const [feeds, counts] = await Promise.all([
        prisma.feed.findMany({
            where: {
                users: {
                    some: {
                        id: userId,
                    },
                },
            },
        }),
        prisma.$queryRaw<FeedItemCounts[]>`
            SELECT "feedId",
                   count(*) AS total,
                   count(*) FILTER (WHERE NOT "isRead") AS unread,
                   count(*) FILTER (WHERE "isBookmarked" AND NOT "isRead") AS "bookmarkedUnread",
                   count(*) FILTER (WHERE "isFavorite" AND NOT "isRead") AS "favoriteUnread"
            FROM "Item"
            WHERE "userId" = ${userId}
            GROUP BY "feedId"
        `,
    ]);

    const countsByFeed = new Map(counts.map(count => [count.feedId, count]));

    return Result.ok(
        feeds.map(feed => {
            const count = countsByFeed.get(feed.id);
            return {
                ...feed,
                totalItemsCount: Number(count?.total ?? 0),
                totalItemsUnreadCount: Number(count?.unread ?? 0),
                bookmarkedItemsUnreadCount: Number(count?.bookmarkedUnread ?? 0),
                favoriteItemsUnreadCount: Number(count?.favoriteUnread ?? 0),
            };
        })
    );
};

const getFeedWithContentByInternalIdentifier = async (
    internalIdentifier: string,
    pagination?: Pagination,
    filter?: Filter
): AsyncResultType<FeedWithContent> => {
    const feed = await prisma.feed.findUnique({
        where: {
            internalIdentifier: internalIdentifier,
        },
        include: {
            contentItems: {
                where: getContentSearchWhere(filter?.search),
                orderBy: contentOrderBy,
                ...getPagination(pagination),
            },
        },
    });

    if (!feed) {
        logger.error(`Feed not found with internal identifier: ${internalIdentifier}`);
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed);
};

const getFeedContentCount = async (
    internalIdentifier: string,
    filter?: Filter
): AsyncResultType<number> => {
    const count = await prisma.itemContent.count({
        where: {
            feed: {
                internalIdentifier,
            },
            ...getContentSearchWhere(filter?.search),
        },
    });

    return Result.ok(count);
};

const getFeedForRefresh = async (feedId: number): AsyncResultType<FeedForRefresh> => {
    const feed = await prisma.feed.findUnique({
        where: {
            id: feedId,
        },
        select: {
            id: true,
            rssUrl: true,
            contentItems: {
                select: { link: true },
            },
        },
    });

    if (!feed) {
        logger.error(`Feed not found with id: ${feedId}`);
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed);
};

export type OrphanedFeed = {
    id: number;
    name: string;
    rssUrl: string;
};

const getOrphanedFeeds = async ({
    olderThan,
    limit = 100,
}: {
    olderThan: Date;
    limit?: number;
}): AsyncResultType<OrphanedFeed[]> => {
    try {
        const feeds = await prisma.feed.findMany({
            where: {
                users: { none: {} },
                items: { none: { OR: [{ isBookmarked: true }, { isFavorite: true }] } },
                updatedAt: { lt: olderThan },
            },
            orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
            take: limit,
            select: { id: true, name: true, rssUrl: true },
        });

        return Result.ok(feeds);
    } catch (error: unknown) {
        logger.error(`Could not find orphaned feeds - ${error}`);
        return Result.error("Could not find orphaned feeds", "InternalError");
    }
};

const deleteFeed = async (feedId: number): AsyncResultType<boolean> => {
    try {
        const deleted = await prisma.$transaction(async tx => {
            const locked = await tx.$queryRaw<{ id: number }[]>`
                SELECT "id" FROM "Feed" WHERE "id" = ${feedId} FOR UPDATE
            `;

            if (locked.length === 0) {
                return false;
            }

            const subscribers = await tx.feed.count({
                where: { id: feedId, users: { some: {} } },
            });

            if (subscribers > 0) {
                return false;
            }

            await tx.$queryRaw`
                SELECT "id" FROM "Item" WHERE "feedId" = ${feedId} ORDER BY "id" FOR UPDATE
            `;
            const savedItems = await tx.item.count({
                where: { feedId, OR: [{ isBookmarked: true }, { isFavorite: true }] },
            });

            if (savedItems > 0) {
                return false;
            }

            // relationMode = "prisma" means the join table has no foreign keys.
            await tx.$executeRaw`
                DELETE FROM "_ItemToTag" AS tags
                USING "Item" AS items
                WHERE tags."A" = items."id" AND items."feedId" = ${feedId}
            `;
            await tx.item.deleteMany({ where: { feedId } });
            await tx.itemContent.deleteMany({ where: { feedId } });
            await tx.feed.delete({ where: { id: feedId } });

            return true;
        });

        return Result.ok(deleted);
    } catch (error: unknown) {
        logger.error(`Could not delete feed ${feedId} - ${error}`);
        return Result.error(`Could not delete feed ${feedId}`, "InternalError");
    }
};

const countUserFeeds = async (userId: number): AsyncResultType<number> => {
    try {
        const count = await prisma.feed.count({
            where: {
                users: {
                    some: {
                        id: userId,
                    },
                },
            },
        });

        return Result.ok(count);
    } catch (error: unknown) {
        logger.error(`Could not count feeds for user ${userId} - ${error}`);
        return Result.error(`Could not count feeds for user ${userId}`, "InternalError");
    }
};

const getFeedByRssUrl = async (rssUrl: string): AsyncResultType<Feed> => {
    const feed = await prisma.feed.findUnique({
        where: {
            rssUrl: rssUrl,
        },
    });

    if (!feed) {
        logger.error(`Feed not found with id: ${rssUrl}`);
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed);
};

const getFeedByInternalIdentifier = async (
    feedInternalIdentifier: string
): AsyncResultType<Feed> => {
    const feed = await prisma.feed.findUnique({
        where: {
            internalIdentifier: feedInternalIdentifier,
        },
    });

    if (!feed) {
        logger.error(`Feed not found with internalIdentifier: ${feedInternalIdentifier}`);
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed);
};

const getUserFeedByInternalIdentifier = async ({
    feedInternalIdentifier,
    userId,
    pagination,
    filter,
}: {
    feedInternalIdentifier: string;
    userId: number;
    pagination?: Pagination;
    filter?: Filter;
}): AsyncResultType<FeedWithItems> => {
    const feed = await prisma.feed.findUnique({
        where: {
            internalIdentifier: feedInternalIdentifier,
        },
        include: {
            items: {
                include: {
                    content: true,
                },
                where: {
                    userId: userId,
                    ...getFilterWhere(filter),
                },
                orderBy: itemOrderBy,
                ...getPagination(pagination),
            },
        },
    });

    if (!feed) {
        logger.error(`Feed not found with internalIdentifier: ${feedInternalIdentifier}`);
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed);
};

const addFeedToUser = async (feedId: number, userId: number): AsyncResultType<Feed> => {
    const feed = await prisma.feed.update({
        where: {
            id: feedId,
        },
        data: {
            users: {
                connect: {
                    id: userId,
                },
            },
        },
    });

    if (!feed) {
        logger.error("Could not add feed to user");
        return Result.error("Could not add feed to user", "InternalError");
    }

    return Result.ok(feed);
};

const removeFeedFromUser = async (feedId: number, userId: number): AsyncResultType<void> => {
    try {
        await prisma.$transaction(async tx => {
            await tx.feed.update({
                where: { id: feedId },
                data: { users: { disconnect: { id: userId } } },
            });
            await tx.$queryRaw`
                SELECT "id" FROM "Item"
                WHERE "feedId" = ${feedId} AND "userId" = ${userId}
                ORDER BY "id" FOR UPDATE
            `;
            await tx.$executeRaw`
                DELETE FROM "_ItemToTag" AS tags
                USING "Item" AS items
                WHERE tags."A" = items."id"
                  AND items."feedId" = ${feedId} AND items."userId" = ${userId}
                  AND NOT items."isBookmarked" AND NOT items."isFavorite"
            `;
            await tx.item.deleteMany({
                where: { feedId, userId, isBookmarked: false, isFavorite: false },
            });
        });
    } catch (error: unknown) {
        logger.error({ err: error, feedId, userId }, "Could not remove feed from user");
        return Result.error("Could not remove feed from user", "InternalError");
    }

    return Result.okEmpty();
};

const searchFeeds = async ({ query, userId }: SearchFeedsProps): AsyncResultType<SearchFeed[]> => {
    try {
        const feeds = await prisma.feed.findMany({
            where: {
                users: { none: { id: userId } },
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { url: { contains: query, mode: "insensitive" } },
                    { rssUrl: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                ],
            },
            select: searchFeedSelect,
            orderBy: [{ name: "asc" }, { id: "asc" }],
            take: feedSearchLimit,
        });
        return Result.ok(feeds);
    } catch (error) {
        logger.error(`Could not search feeds for query ${query} - ${error}`);
        return Result.error("Could not search feeds", "InternalError");
    }
};

const isSubscribedToFeed = async (
    internalIdentifier: string,
    userId: number
): AsyncResultType<boolean> => {
    const feed = await prisma.feed.findUnique({
        where: {
            internalIdentifier: internalIdentifier,
        },
        include: {
            users: {
                where: {
                    id: userId,
                },
            },
        },
    });

    if (!feed) {
        logger.error(`Feed not found with id: ${internalIdentifier}`);
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed.users.length > 0);
};

const getFeedItemsCount = async ({
    internalIdentifier,
    userId,
    filter,
}: FeedItemsCountOptions): AsyncResultType<number> => {
    const count = await prisma.item.count({
        where: {
            feed: {
                internalIdentifier,
            },
            userId,
            ...getFilterWhere(filter),
        },
    });

    return Result.ok(count);
};

const markAllAsRead = async (feedId: number, userId: number): AsyncResultType<void> => {
    const feed = await prisma.feed.update({
        where: {
            id: feedId,
        },
        data: {
            items: {
                updateMany: {
                    where: {
                        userId: userId,
                    },
                    data: {
                        isRead: true,
                    },
                },
            },
        },
    });

    if (!feed) {
        logger.error(`Could not mark all as read for feed ${feedId} for user ${userId}`);
        return Result.error("Could not mark all as read", "InternalError");
    }

    return Result.okEmpty();
};

export const FeedRepository = {
    saveSubscription,
    getAllFeedsByUserId,
    getFeedForRefresh,
    countUserFeeds,
    getOrphanedFeeds,
    deleteFeed,
    getFeedByRssUrl,
    getUserFeedByInternalIdentifier,
    getFeedByInternalIdentifier,
    getFeedWithContentByInternalIdentifier,
    addFeedToUser,
    searchFeeds,
    removeFeedFromUser,
    isSubscribedToFeed,
    getFeedItemsCount,
    getFeedContentCount,
    markAllAsRead,
};
