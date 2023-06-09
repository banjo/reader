import createLogger from "@/server/lib/logger";
import prisma from "@/server/repositories/prisma";
import { CreateFeed, CreateItem, FeedWithItems } from "@/shared/models/entities";
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
            items: true,
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
            items: true,
        },
    });

    if (!feed) {
        logger.error(`Feed not found with id: ${rssUrl}`);
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed);
};

const getFeedByInternalIdentifier = async (
    feedInternalIdentifier: string,
    userId: number
): Promise<ResultType<FeedWithItems>> => {
    const feed = await prisma.feed.findUnique({
        where: {
            internalIdentifier: feedInternalIdentifier,
        },
        include: {
            items: {
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

const createFeed = async (
    feed: CreateFeed,
    items: CreateItem[],
    userId: number
): Promise<ResultType<Feed>> => {
    const createdFeed = await prisma.feed.create({
        data: {
            ...feed,
            items: { createMany: { data: items } },
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
            items: true,
        },
    });

    if (!feed) {
        logger.error("Could not add feed to user");
        return Result.error("Could not add feed to user", "InternalError");
    }

    return Result.ok(feed);
};

export const FeedRepository = {
    getAllFeedsByUserId,
    getFeedById,
    getFeedByRssUrl,
    getFeedByInternalIdentifier,
    createFeed,
    addFeedToUser,
};
