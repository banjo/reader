import { CleanFeedWithContent, CleanFeedWithItems } from "db";
import { AsyncResultType, Filter, Pagination } from "model";
import { Result, createLogger } from "utils";
import { ContentMapper } from "../mappers/ContentMapper";
import { DatabaseMapper } from "../mappers/DatabaseMapper";
import { FeedMapper, SearchFeed } from "../mappers/FeedMapper";
import {
    FeedItemsCountOptions,
    FeedRepository,
    FeedWithItemCounts,
} from "../repositories/FeedRepository";
import { ItemRepository } from "../repositories/ItemRepository";
import { FeedRefresh } from "../shared/lib/feed-refresh";
import { fetchContentWithoutImageWorker, fetchRssFeedWorker } from "../workers";
import { ParseService } from "./ParseService";

const logger = createLogger("FeedService");

const getUserFeedByInternalIdentifier = async ({
    feedInternalIdentifier,
    userId,
    pagination,
    filter,
}: {
    feedInternalIdentifier: string;
    userId: number;
    pagination: Pagination;
    filter: Filter;
}): AsyncResultType<CleanFeedWithItems> => {
    const feedResponse = await FeedRepository.getUserFeedByInternalIdentifier({
        feedInternalIdentifier,
        userId,
        pagination,
        filter,
    });

    if (!feedResponse.success) {
        logger.error(`no feed found in db with public url ${feedInternalIdentifier}`);
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(DatabaseMapper.feedWithItems(feedResponse.data));
};

const getAllFeedsByUserId = async (userId: number): AsyncResultType<FeedWithItemCounts[]> => {
    const feedsResponse = await FeedRepository.getAllFeedsByUserId(userId);

    if (!feedsResponse.success) {
        logger.error("no feeds found in db");
        return Result.error("No feeds found", "NotFound");
    }

    return Result.ok(feedsResponse.data);
};

type AddFeedResponse = {
    feedId: number;
};

const addFeed = async (rssUrl: string, userId: number): AsyncResultType<AddFeedResponse> => {
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
        const assignFeedItemsToUserResult = await ItemRepository.assignFeedItemsToUser({
            feedId: id,
            userId,
        });

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

    const faviconResult = await ParseService.parseFavicon(parseResult.data.link);

    let faviconUrl: undefined | string;
    if (faviconResult.success) {
        faviconUrl = faviconResult.data;
    }

    const feedToCreate = FeedMapper.parseFeedToCreateFeed(parseResult.data, rssUrl, faviconUrl);

    const createFeedResult = await FeedRepository.createFeed(feedToCreate, userId);

    if (!createFeedResult.success) {
        logger.error(`failed to create feed with url ${rssUrl}`);
        return Result.error("Failed to create feed", "InternalError");
    }

    const contentToCreate = FeedRefresh.selectInitialFeedItems(parseResult.data.items).map(
        parsedItem => {
            return ContentMapper.parseItemToCreateContent(parsedItem);
        }
    );

    const createContentResult = await ItemRepository.createContent(
        contentToCreate,
        createFeedResult.data.id
    );

    if (!createContentResult.success) {
        logger.error(`failed to create content for feed with url ${rssUrl}`);
        return Result.error("Failed to create content", "InternalError");
    }

    const createItemsResult = await ItemRepository.createItemsFromContent(
        createContentResult.data,
        createFeedResult.data.id,
        userId
    );

    if (!createItemsResult.success) {
        logger.error(`failed to create items for feed with url ${rssUrl}`);
        return Result.error("Failed to create items", "InternalError");
    }

    await fetchRssFeedWorker().repeatable({
        feedId: createFeedResult.data.id,
    });

    await fetchContentWithoutImageWorker().add({});

    return Result.ok({ feedId: createFeedResult.data.id });
};

const searchFeeds = async (query: string, userId?: number): AsyncResultType<SearchFeed[]> => {
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
): AsyncResultType<void> => {
    const feedResult = await FeedRepository.getFeedByInternalIdentifier(internalIdentifier);

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

const getFeedWithItemsOrContent = async ({
    internalIdentifier,
    userId,
    pagination,
    filter,
}: {
    internalIdentifier: string;
    userId: number;
    pagination: Pagination;
    filter: Filter;
}): AsyncResultType<CleanFeedWithItems | CleanFeedWithContent> => {
    const isSubscribedResponse = await FeedRepository.isSubscribedToFeed(
        internalIdentifier,
        userId
    );

    if (!isSubscribedResponse.success) {
        logger.error(
            `user is not subscribed to feed with internal identifier ${internalIdentifier}`
        );
        return Result.error("User is not subscribed to feed", "NotFound");
    }

    const isSubscribed = isSubscribedResponse.data;

    if (isSubscribed) {
        const feedWithItemsResponse = await getUserFeedByInternalIdentifier({
            feedInternalIdentifier: internalIdentifier,
            userId,
            pagination,
            filter,
        });

        if (!feedWithItemsResponse.success) {
            return Result.error("Could not fetch user feed", "NotFound");
        }

        return Result.ok(feedWithItemsResponse.data);
    }

    // not subscribed
    const feedWithContentResponse = await FeedRepository.getFeedWithContentByInternalIdentifier(
        internalIdentifier,
        pagination
    );

    if (!feedWithContentResponse.success) {
        return Result.error("Could not get content feed by identifier", "InternalError");
    }

    return Result.ok({
        ...feedWithContentResponse.data,
        isSubscribed: false,
    });
};

const subscribeToFeed = async (
    internalIdentifier: string,
    userId: number
): AsyncResultType<void> => {
    const feedResult = await FeedRepository.getFeedByInternalIdentifier(internalIdentifier);

    if (!feedResult.success) {
        logger.error(`Could not find feed with identifier ${internalIdentifier}`);
        return Result.error("Could not find feed", "NotFound");
    }

    const addResult = await FeedRepository.addFeedToUser(feedResult.data.id, userId);

    if (!addResult.success) {
        logger.error(`Could not add feed with id ${feedResult.data.id} to user ${userId}`);
        return Result.error("Could not add feed to user", "InternalError");
    }

    const assignResult = await ItemRepository.assignFeedItemsToUser({
        feedId: feedResult.data.id,
        userId,
    });

    if (!assignResult.success) {
        logger.error(`Could not assign items for feed with id ${feedResult.data.id}`);
        return Result.error("Could not assign items for feed", "InternalError");
    }

    return Result.okEmpty();
};

const getFeedItemsCount = async (options: FeedItemsCountOptions): AsyncResultType<number> => {
    const count = await FeedRepository.getFeedItemsCount(options);

    if (!count.success) {
        logger.error(`Could not get count for feed with identifier ${options.internalIdentifier}`);
        return Result.error("Could not get count for feed", "InternalError");
    }

    return Result.ok(count.data);
};

const getFeedContentCount = async (internalIdentifier: string): AsyncResultType<number> => {
    const count = await FeedRepository.getFeedContentCount(internalIdentifier);

    if (!count.success) {
        logger.error(`Could not get content count for feed with identifier ${internalIdentifier}`);
        return Result.error("Could not get count for feed", "InternalError");
    }

    return Result.ok(count.data);
};

const markAllAsRead = async (feedId: number, userId: number): AsyncResultType<void> => {
    const markResult = await FeedRepository.markAllAsRead(feedId, userId);

    if (!markResult.success) {
        logger.error(`Could not mark all as read for feed with id ${feedId}`);
        return Result.error("Could not mark all as read", "InternalError");
    }

    return Result.okEmpty();
};

export const FeedService = {
    addFeed,
    getUserFeedByInternalIdentifier,
    getAllFeedsByUserId,
    searchFeeds,
    unsubscribeFromFeed,
    getFeedWithItemsOrContent,
    subscribeToFeed,
    getFeedItemsCount,
    getFeedContentCount,
    markAllAsRead,
};
