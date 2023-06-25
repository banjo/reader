import createLogger from "@/server/lib/logger";
import { ContentMapper } from "@/server/mappers/ContentMapper";
import { DatabaseMapper } from "@/server/mappers/DatabaseMapper";
import { FeedMapper } from "@/server/mappers/FeedMapper";
import { ItemMapper } from "@/server/mappers/ItemMapper";
import { ContentRepository } from "@/server/repositories/ContentRepository";
import { FeedRepository } from "@/server/repositories/FeedRepository";
import { ItemRepository } from "@/server/repositories/ItemRespository";
import { ParseService } from "@/server/services/ParseService";
import { CleanFeedWithItems, CreateItemWithContentId, SearchFeed } from "@/shared/models/entities";
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
    const contentResponse = await ContentRepository.getAllContentById(feedId);

    if (!contentResponse.success) {
        logger.error(`no content items found in db for feed with id ${feedId}`);
        return Result.error("Content not found", "NotFound");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const newItems: CreateItemWithContentId[] = contentResponse.data.map(content => {
        return { ...ItemMapper.defaultItem(), userId: userId, contentId: content.id };
    });

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

        const feedAssignedToUserResult = await FeedRepository.checkIfFeedIsAssignedToUser(
            id,
            userId
        );

        if (!feedAssignedToUserResult.success) {
            logger.info(
                `Something went wrong with checking if feed ${id} was assigned to user ${userId}`
            );
            return Result.error("Failed to add feed to user", "InternalError");
        }

        if (feedAssignedToUserResult.data) {
            // TODO: update feed items
            logger.info(`feed ${id} already assigned to user ${userId}`);
            return Result.ok({ feedId: id });
        }

        const addFeedToUserResult = await FeedRepository.addFeedToUser(id, userId);

        if (!addFeedToUserResult.success) {
            logger.error("failed to add feed to user");
            return Result.error("Failed to add feed to user", "InternalError");
        }

        // TODO: update feed items with new scan
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

    const feedToCreate = FeedMapper.parseFeedToCreateFeed(parseResult.data, rssUrl);

    const createFeedResult = await FeedRepository.createFeed(feedToCreate, userId);

    if (!createFeedResult.success) {
        logger.error(`failed to create feed with url ${rssUrl}`);
        return Result.error("Failed to create feed", "InternalError");
    }

    const contentToCreate = parseResult.data.items.map(parsedItem => {
        return ContentMapper.parseItemToCreateContent(parsedItem, createFeedResult.data.id);
    });

    const createContentResult = await ItemRepository.createItemsWithContentFromContent(
        contentToCreate,
        createFeedResult.data.id,
        userId
    );

    if (!createContentResult.success) {
        logger.error(`failed to create content for feed with url ${rssUrl}`);
        return Result.error("Failed to create content", "InternalError");
    }

    return Result.ok({ feedId: createFeedResult.data.id });
};

const searchFeeds = async (query: string, userId?: number): Promise<ResultType<SearchFeed[]>> => {
    const feedsResponse = await FeedRepository.searchFeeds(query);

    if (!feedsResponse.success) {
        logger.error(`no feeds found in db for query ${query}`);
        return Result.error("No feeds found", "NotFound");
    }

    const feedsNotConnectedToUser = feedsResponse.data.filter(feed => {
        return feed.users.every(user => user.id !== userId);
    });

    return Result.ok(feedsNotConnectedToUser.map(feed => FeedMapper.feedToSearchFeed(feed)));
};

const unsubscribeFromFeed = async (
    internalIdentifier: string,
    userId: number
): Promise<ResultType<void>> => {
    const feedResult = await FeedRepository.getFeedByInternalIdentifier(internalIdentifier, userId);

    if (!feedResult.success) {
        if (feedResult.type === "NotFound") {
            logger.error(`no feed found in db with public url ${internalIdentifier}`);
            return Result.error("Feed not found", "NotFound");
        }

        logger.error(`failed to get feed with public url ${internalIdentifier}`);

        return Result.error("Failed to get feed", "InternalError");
    }

    const removeResult = await FeedRepository.removeFeedFromUser(feedResult.data.id, userId);

    if (!removeResult.success) {
        logger.error(`failed to remove feed with id ${feedResult.data.id} from user ${userId}`);
        return Result.error("Failed to remove feed from user", "InternalError");
    }

    const removeItemsResult = await ItemRepository.removeFeedItemsForUser(
        feedResult.data.id,
        userId
    );

    if (!removeItemsResult.success) {
        logger.error(`failed to remove items for feed with id ${feedResult.data.id}`);
        return Result.error("Failed to remove items for feed", "InternalError");
    }

    return Result.okEmpty();
};

export const FeedService = {
    addFeed,
    getFeedByInternalIdentifier,
    getAllFeedsByUserId,
    searchFeeds,
    unsubscribeFromFeed,
};
