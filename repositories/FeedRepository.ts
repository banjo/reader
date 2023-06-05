import { Result } from "@/models/result";
import prisma from "@/repositories/prisma";
import { Feed } from "@prisma/client";

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
        return Result.error("NotFound", "No feeds found");
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
        return Result.error("NotFound", "Feed not found");
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
        return Result.error("NotFound", "Feed not found");
    }

    return Result.ok(feed);
};

const createFeed = async (feed: Feed): Promise<Result<Feed>> => {
    const createdFeed = await prisma.feed.create({
        data: feed,
    });

    if (!createdFeed) {
        return Result.error("InternalError", "Could not create feed");
    }

    return Result.ok(createdFeed);
};

export const FeedRepository = {
    getAllUserFeeds,
    getFeedById,
    getFeedByUrl,
    createFeed,
};
