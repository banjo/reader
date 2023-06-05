import { Result } from "@/models/result";
import prisma from "@/server/repositories/prisma";
import { Feed } from "@prisma/client";
import "server-only";

const getAllUserFeeds = async (userId: number): Promise<Result<Feed[]>> => {
    const feeds = await prisma.feed.findMany({
        where: {
            users: {
                some: {
                    id: userId,
                },
            },
        },
    });

    if (!feeds) {
        return Result.error("No feeds found", "NotFound");
    }

    return Result.ok(feeds);
};

const getFeedById = async (feedId: number): Promise<Result<Feed>> => {
    const feed = await prisma.feed.findUnique({
        where: {
            id: feedId,
        },
    });

    if (!feed) {
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed);
};

const getFeedByUrl = async (feedUrl: string): Promise<Result<Feed>> => {
    const feed = await prisma.feed.findUnique({
        where: {
            link: feedUrl,
        },
    });

    if (!feed) {
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(feed);
};

const createFeed = async (feed: Feed): Promise<Result<Feed>> => {
    const createdFeed = await prisma.feed.create({
        data: feed,
    });

    if (!createdFeed) {
        return Result.error("Could not create feed", "InternalError");
    }

    return Result.ok(createdFeed);
};

export const FeedRepository = {
    getAllUserFeeds,
    getFeedById,
    getFeedByUrl,
    createFeed,
};
