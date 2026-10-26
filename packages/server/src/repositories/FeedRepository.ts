import { sortBy } from "@banjoanton/utils";
import { Feed, FeedWithContent, FeedWithItems, FeedWithUsers, Prisma, prisma } from "db";
import { AsyncResultType, Filter, Pagination } from "model";
import { Result, createLogger } from "utils";
import { getFilterWhere, getPagination, sortItems } from "../shared/lib/utils";

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
    internalIdentifier: string
): AsyncResultType<FeedWithContent> => {
    const feed = await prisma.feed.findUnique({
        where: {
            internalIdentifier: internalIdentifier,
        },
        include: {
            contentItems: true,
        },
    });

    if (!feed) {
        logger.error(`Feed not found with internal identifier: ${internalIdentifier}`);
        return Result.error("Feed not found", "NotFound");
    }

    feed.contentItems = sortBy(feed.contentItems, "createdAt", "desc");
    return Result.ok(feed);
};

const getFeedWithContentById = async (feedId: number): AsyncResultType<FeedWithContent> => {
    const feed = await prisma.feed.findUnique({
        where: {
            id: feedId,
        },
        include: {
            contentItems: true,
        },
    });

    if (!feed) {
        logger.error(`Feed not found with id: ${feedId}`);
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed);
};

const getFeedById = async (feedId: number): AsyncResultType<FeedWithItems> => {
    const feed = await prisma.feed.findUnique({
        where: {
            id: feedId,
        },
        include: {
            items: {
                include: {
                    content: true,
                },
            },
        },
    });

    if (!feed) {
        logger.error(`Feed not found with id: ${feedId}`);
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed);
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
                orderBy: {
                    content: {
                        pubDate: "desc",
                    },
                },
                ...getPagination(pagination),
            },
        },
    });

    if (!feed) {
        logger.error(`Feed not found with internalIdentifier: ${feedInternalIdentifier}`);
        return Result.error("Feed not found", "NotFound");
    }

    feed.items = sortItems(feed.items);
    return Result.ok(feed);
};

const createFeed = async (feed: Prisma.FeedCreateInput, userId: number): AsyncResultType<Feed> => {
    const createdFeed = await prisma.feed.create({
        data: {
            ...feed,
            users: {
                connect: {
                    id: userId,
                },
            },
        },
    });

    if (!createdFeed) {
        logger.error("Could not create feed");
        return Result.error("Could not create feed", "InternalError");
    }

    return Result.ok(createdFeed);
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
    const feed = await prisma.feed.update({
        where: {
            id: feedId,
        },
        data: {
            users: {
                disconnect: {
                    id: userId,
                },
            },
        },
    });

    if (!feed) {
        logger.error("Could not remove feed from user");
        return Result.error("Could not remove feed from user", "InternalError");
    }

    return Result.okEmpty();
};

const searchFeeds = async (searchTerm: string): AsyncResultType<FeedWithUsers[]> => {
    // TODO: change to search instead of contains when it works with prisma
    // TODO2: Exclude feeds that have connection to user by id here instead of in service

    const feeds = await prisma.feed.findMany({
        where: {
            OR: [
                {
                    name: {
                        contains: searchTerm,
                    },
                },
                {
                    url: {
                        contains: searchTerm,
                    },
                },
                {
                    rssUrl: {
                        contains: searchTerm,
                    },
                },
                {
                    description: {
                        contains: searchTerm,
                    },
                },
            ],
        },
        include: {
            users: true,
        },
    });

    if (!feeds) {
        logger.error(`No feeds found with query ${searchTerm}`);
        return Result.error("No feeds found", "NotFound");
    }

    return Result.ok(feeds);
};

const checkIfFeedIsAssignedToUser = async (
    feedId: number,
    userId: number
): AsyncResultType<boolean> => {
    const feed = await prisma.feed.findUnique({
        where: {
            id: feedId,
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
        logger.error(`Feed not found with id: ${feedId}`);
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed.users.length > 0);
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
    getAllFeedsByUserId,
    getFeedById,
    getFeedWithContentById,
    getFeedByRssUrl,
    getUserFeedByInternalIdentifier,
    getFeedByInternalIdentifier,
    getFeedWithContentByInternalIdentifier,
    createFeed,
    addFeedToUser,
    searchFeeds,
    checkIfFeedIsAssignedToUser,
    removeFeedFromUser,
    isSubscribedToFeed,
    getFeedItemsCount,
    markAllAsRead,
};
