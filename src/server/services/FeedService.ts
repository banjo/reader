import createLogger from "@/server/lib/logger";
import { DatabaseMapper } from "@/server/mappers/DatabaseMapper";
import { FeedMapper } from "@/server/mappers/FeedMapper";
import { ItemMapper } from "@/server/mappers/ItemMapper";
import { FeedRepository } from "@/server/repositories/FeedRepository";
import { ItemRepository } from "@/server/repositories/ItemRespository";
import { ParseService } from "@/server/services/ParseService";
import { CleanFeedWithItems, CreateItem } from "@/shared/models/entities";
import { Result, ResultType } from "@/shared/models/result";

const logger = createLogger("FeedService");

const getFeedByInternalIdentifier = async (
    feedInternalIdentifier: string,
    userId: number
): Promise<ResultType<CleanFeedWithItems>> => {
    const feedResponse = await FeedRepository.getFeedByInternalIdentifier(
        feedInternalIdentifier,
        userId
    );

    if (!feedResponse.success) {
        logger.error(`no feed found in db with public url ${feedInternalIdentifier}`);
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(DatabaseMapper.feed(feedResponse.data));
};

const getAllFeedsByUserId = async (userId: number): Promise<ResultType<CleanFeedWithItems[]>> => {
    const feedsResponse = await FeedRepository.getAllFeedsByUserId(userId);

    if (!feedsResponse.success) {
        logger.error("no feeds found in db");
        return Result.error("No feeds found", "NotFound");
    }

    return Result.ok(feedsResponse.data.map(feed => DatabaseMapper.feed(feed)));
};

const assignFeedItemsToUser = async (feedId: number, userId: number): Promise<ResultType<void>> => {
    const itemsResponse = await ItemRepository.getItemsByFeedId(feedId);

    if (!itemsResponse.success) {
        logger.error(`no items found in db for feed with id ${feedId}`);
        return Result.error("Items not found", "NotFound");
    }

    const newItems: CreateItem[] = itemsResponse.data.map(item =>
        ItemMapper.itemToCreateItem(item, userId)
    );

    const addItemsResult = await ItemRepository.createItems(newItems, feedId, userId);

    if (!addItemsResult.success) {
        logger.error(`failed to add items to user with id ${userId}`);
        return Result.error("Failed to add items to user", "InternalError");
    }

    return Result.okEmpty();
};

type AddFeedResponse = {
    feedId: number;
};

const addFeed = async (rssUrl: string, userId: number): Promise<ResultType<AddFeedResponse>> => {
    // TODO: add transactions in db
    const existingFeed = await FeedRepository.getFeedByRssUrl(rssUrl);

    if (existingFeed.success) {
        logger.info("feed already exists in db, adding to user's feeds");
        const id = existingFeed.data.id;
        const addFeedToUserResult = await FeedRepository.addFeedToUser(id, userId);

        if (!addFeedToUserResult.success) {
            logger.error("failed to add feed to user");
            return Result.error("Failed to add feed to user", "InternalError");
        }

        const assignFeedItemsToUserResult = await assignFeedItemsToUser(id, userId);

        if (!assignFeedItemsToUserResult.success) {
            logger.error("failed to add items to feed");
            return Result.error("Failed to add items to feed", "InternalError");
        }

        return Result.ok({ feedId: id });
    }

    const parseResult = await ParseService.parseRssFeed(rssUrl);

    if (!parseResult.success) {
        logger.error("failed to parse feed");
        return Result.error("Failed to parse feed", "InternalError");
    }

    const itemsToCreate = parseResult.data.items.map(item =>
        ItemMapper.parseItemToCreateItem(item, userId)
    );
    const feedToCreate = FeedMapper.parseFeedToCreateFeed(parseResult.data, rssUrl);

    const createFeedResult = await FeedRepository.createFeed(feedToCreate, itemsToCreate, userId);

    if (!createFeedResult.success) {
        logger.error(`failed to create feed with url ${rssUrl}`);
        return Result.error("Failed to create feed", "InternalError");
    }

    return Result.ok({ feedId: createFeedResult.data.id });
};

export const FeedService = {
    addFeed,
    getFeedByInternalIdentifier,
    getAllFeedsByUserId,
};
