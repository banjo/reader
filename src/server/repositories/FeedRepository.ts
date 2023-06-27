import createLogger from "@/server/lib/logger";
import prisma from "@/server/repositories/prisma";
import { CreateFeed, FeedWithItems, FeedWithUser } from "@/shared/models/entities";
import { Result, ResultType } from "@/shared/models/result";
import { Feed } from "@prisma/client";
import "server-only";

const logger = createLogger("FeedRepository");

const getAllFeedsByUserId = async (userId: number): Promise<ResultType<FeedWithItems[]>> => {
    const feeds = await prisma.feed.findMany({
        where: {
            users: {
                some: {
                    id: userId,
                },
            },
        },
        include: {
            items: {
                include: {
                    content: true,
                },
                where: {
                    userId: userId,
                },
            },
        },
    });

    if (!feeds) {
        logger.error("No feeds found");
        return Result.error("No feeds found", "NotFound");
    }

    return Result.ok(feeds);
};

const getFeedById = async (feedId: number): Promise<ResultType<FeedWithItems>> => {
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

const getFeedByRssUrl = async (rssUrl: string): Promise<ResultType<FeedWithItems>> => {
    const feed = await prisma.feed.findUnique({
        where: {
            rssUrl: rssUrl,
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
        logger.error(`Feed not found with id: ${rssUrl}`);
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed);
};

const getFeedByInternalIdentifier = async (
    feedInternalIdentifier: string
): Promise<ResultType<FeedWithItems>> => {
    const feed = await prisma.feed.findUnique({
        where: {
            internalIdentifier: feedInternalIdentifier,
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
        logger.error(`Feed not found with internalIdentifier: ${feedInternalIdentifier}`);
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed);
};

const getUserFeedByInternalIdentifier = async (
    feedInternalIdentifier: string,
    userId: number
): Promise<ResultType<FeedWithItems>> => {
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
                },
            },
        },
    });

    if (!feed) {
        logger.error(`Feed not found with internalIdentifier: ${feedInternalIdentifier}`);
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed);
};

const createFeed = async (feed: CreateFeed, userId: number): Promise<ResultType<Feed>> => {
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

const addFeedToUser = async (
    feedId: number,
    userId: number
): Promise<ResultType<FeedWithItems>> => {
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
        include: {
            items: {
                include: {
                    content: true,
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

const removeFeedFromUser = async (feedId: number, userId: number): Promise<ResultType<void>> => {
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

const searchFeeds = async (searchTerm: string): Promise<ResultType<FeedWithUser[]>> => {
    // TODO: change to search instead of contains when it works with prisma
    // TODO2: Exclude feeds that have connection to user by id here instead of in service

    const feeds: FeedWithUser[] = await prisma.feed.findMany({
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
): Promise<ResultType<boolean>> => {
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

export const FeedRepository = {
    getAllFeedsByUserId,
    getFeedById,
    getFeedByRssUrl,
    getUserFeedByInternalIdentifier,
    getFeedByInternalIdentifier,
    createFeed,
    addFeedToUser,
    searchFeeds,
    checkIfFeedIsAssignedToUser,
    removeFeedFromUser,
};
