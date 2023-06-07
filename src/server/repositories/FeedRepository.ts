import createLogger from "@/server/lib/logger";
import prisma from "@/server/repositories/prisma";
import { FeedWithItems } from "@/shared/models/entities";
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
            items: true,
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
        logger.error("Feed not found");
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed);
};

const getFeedByUrl = async (feedUrl: string): Promise<ResultType<FeedWithItems>> => {
    const feed = await prisma.feed.findUnique({
        where: {
            link: feedUrl,
        },
        include: {
            items: true,
        },
    });

    if (!feed) {
        logger.error("Feed not found");
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed);
};

const getFeedByPublicUrl = async (feedPublicUrl: string): Promise<ResultType<FeedWithItems>> => {
    const feed = await prisma.feed.findUnique({
        where: {
            publicUrl: feedPublicUrl,
        },
        include: {
            items: true,
        },
    });

    if (!feed) {
        logger.error("Feed not found");
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed);
};

const createFeed = async (feed: Feed): Promise<ResultType<FeedWithItems>> => {
    const createdFeed = await prisma.feed.create({
        data: feed,
    });

    if (!createdFeed) {
        logger.error("Could not create feed");
        return Result.error("Could not create feed", "InternalError");
    }

    return Result.ok(createdFeed);
};

export const FeedRepository = {
    getAllFeedsByUserId,
    getFeedById,
    getFeedByUrl,
    getFeedByPublicUrl,
    createFeed,
};