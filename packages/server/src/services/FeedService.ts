import { CleanFeedWithContent, CleanFeedWithItems } from "db";
import { AsyncResultType, Filter, Pagination, ResultType, SearchFeed } from "model";
import { Result, createLogger } from "utils";
import { ContentMapper } from "../mappers/ContentMapper";
import { DatabaseMapper } from "../mappers/DatabaseMapper";
import { FeedMapper } from "../mappers/FeedMapper";
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
type AddFeedOptions = { requestAttempts?: number; scheduleExisting?: boolean };

const addFeed = async (
    rssUrl: string,
    userId: number,
    { requestAttempts, scheduleExisting = false }: AddFeedOptions = {}
): Promise<ResultType<AddFeedResponse> & { retryable?: boolean }> => {
    try {
        const existingFeed = await FeedRepository.getFeedByRssUrl(rssUrl);
        let feedId: number;
        if (existingFeed.success) {
            feedId = await FeedRepository.saveSubscription({ rssUrl, userId });
            if (!scheduleExisting) {
                return Result.ok({ feedId });
            }
        } else {
            const parseResult = await ParseService.parseRssFeed(rssUrl, {
                attempts: requestAttempts,
            });
            if (!parseResult.success) {
                return parseResult;
            }
            const faviconResult = await ParseService.parseFavicon(parseResult.data.link, {
                attempts: requestAttempts,
            });
            const faviconUrl = faviconResult.success ? faviconResult.data : undefined;
            const feed = FeedMapper.parseFeedToCreateFeed(parseResult.data, rssUrl, faviconUrl);
            const content = FeedRefresh.selectInitialFeedItems(parseResult.data.items).map(
                ContentMapper.parseItemToCreateContent
            );
            feedId = await FeedRepository.saveSubscription({ rssUrl, userId, feed, content });
        }

        // Retrying after a queue failure is safe: the database writes and schedule are idempotent.
        await fetchRssFeedWorker().repeatable({ feedId });
        await fetchContentWithoutImageWorker().add(
            {},
            { deduplication: { id: "feed-import-image-scan" } }
        );
        return Result.ok({ feedId });
    } catch (error) {
        logger.error({ err: error, rssUrl, userId }, "Failed to save feed subscription");
        return {
            ...Result.error<AddFeedResponse>("Failed to save feed subscription", "InternalError"),
            retryable: true,
        };
    }
};

const searchFeeds = async (query: string, userId: number): AsyncResultType<SearchFeed[]> => {
    const feedsResponse = await FeedRepository.searchFeeds({ query, userId });

    if (!feedsResponse.success) {
        logger.error(`Could not search feeds for query ${query} - ${feedsResponse.message}`);
        return Result.error("Could not search feeds", "InternalError");
    }

    return Result.ok(feedsResponse.data);
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
        pagination,
        filter
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

const getFeedContentCount = async (
    internalIdentifier: string,
    filter?: Filter
): AsyncResultType<number> => {
    const count = await FeedRepository.getFeedContentCount(internalIdentifier, filter);

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
