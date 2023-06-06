import { CleanFeedWithItems } from "@/models/entities";
import { Result } from "@/models/result";
import createLogger from "@/server/lib/logger";
import { DatabaseMapper } from "@/server/mappers/DatabaseMapper";
import prisma from "@/server/repositories/prisma";
import { Feed } from "@prisma/client";
import "server-only";

const logger = createLogger("FeedRepository");

const getAllUserFeeds = async (userId: number): Promise<Result<CleanFeedWithItems[]>> => {
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

    return Result.ok(DatabaseMapper.feeds(feeds));
};

const getFeedById = async (feedId: number): Promise<Result<CleanFeedWithItems>> => {
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

    return Result.ok(DatabaseMapper.feed(feed));
};

const getFeedByUrl = async (feedUrl: string): Promise<Result<CleanFeedWithItems>> => {
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

    return Result.ok(DatabaseMapper.feed(feed));
};

const getFeedByPublicUrl = async (feedPublicUrl: string): Promise<Result<CleanFeedWithItems>> => {
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

    return Result.ok(DatabaseMapper.feed(feed));
};

const createFeed = async (feed: Feed): Promise<Result<CleanFeedWithItems>> => {
    const createdFeed = await prisma.feed.create({
        data: feed,
    });

    if (!createdFeed) {
        logger.error("Could not create feed");
        return Result.error("Could not create feed", "InternalError");
    }

    return Result.ok(DatabaseMapper.feed(createdFeed));
};

export const FeedRepository = {
    getAllUserFeeds,
    getFeedById,
    getFeedByUrl,
    getFeedByPublicUrl,
    createFeed,
};