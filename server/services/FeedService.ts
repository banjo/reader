import { CleanFeedWithItems } from "@/models/entities";
import { Result } from "@/models/result";
import { DatabaseMapper } from "@/server/mappers/DatabaseMapper";
import { FeedRepository } from "@/server/repositories/FeedRepository";

const getFeedByPublicUrl = async (feedPublicUrl: string): Promise<Result<CleanFeedWithItems>> => {
    const feedResponse = await FeedRepository.getFeedByPublicUrl(feedPublicUrl);

    if (!feedResponse.success) {
        console.log("no feed found in db");
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(DatabaseMapper.feed(feedResponse.data));
};

const getAllFeedsByUserId = async (userId: number): Promise<Result<CleanFeedWithItems[]>> => {
    const feedsResponse = await FeedRepository.getAllFeedsByUserId(userId);

    if (!feedsResponse.success) {
        console.log("no feeds found in db");
        return Result.error("No feeds found", "NotFound");
    }

    return Result.ok(feedsResponse.data.map(feed => DatabaseMapper.feed(feed)));
};

export const FeedService = {
    getFeedByPublicUrl,
    getAllFeedsByUserId,
};
