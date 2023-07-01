import createLogger from "@/server/lib/logger";
import { ContentMapper } from "@/server/mappers/ContentMapper";
import { DatabaseMapper } from "@/server/mappers/DatabaseMapper";
import { FeedMapper, SearchFeed } from "@/server/mappers/FeedMapper";
import { ItemMapper } from "@/server/mappers/ItemMapper";
import { ContentRepository } from "@/server/repositories/ContentRepository";
import { FeedRepository } from "@/server/repositories/FeedRepository";
import { ItemRepository } from "@/server/repositories/ItemRespository";
import { ParseService } from "@/server/services/ParseService";
import { AsyncResultType, Result } from "@/shared/models/result";

import { CleanFeedWithContent, CleanFeedWithItems } from "@/shared/models/types";

const logger = createLogger("FeedService");

const getUserFeedByInternalIdentifier = async (
    feedInternalIdentifier: string,
    userId: number
): AsyncResultType<CleanFeedWithItems> => {
    const feedResponse = await FeedRepository.getUserFeedByInternalIdentifier(
        feedInternalIdentifier,
        userId
    );

    if (!feedResponse.success) {
        logger.error(`no feed found in db with public url ${feedInternalIdentifier}`);
        return Result.error("Feed not found", "NotFound");
    }

    return Result.ok(DatabaseMapper.feedWithItems(feedResponse.data));
};

const getAllFeedsByUserId = async (userId: number): AsyncResultType<CleanFeedWithItems[]> => {
    const feedsResponse = await FeedRepository.getAllFeedsByUserId(userId);

    if (!feedsResponse.success) {
        logger.error("no feeds found in db");
        return Result.error("No feeds found", "NotFound");
    }

    return Result.ok(feedsResponse.data.map(feed => DatabaseMapper.feedWithItems(feed)));
};

const assignFeedItemsToUser = async (feedId: number, userId: number): AsyncResultType<void> => {
    const contentResponse = await ContentRepository.getAllContentById(feedId);

    if (!contentResponse.success) {
        logger.error(`no content items found in db for feed with id ${feedId}`);
        return Result.error("Content not found", "NotFound");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const newItems = contentResponse.data.map(content => {
        return { ...ItemMapper.defaultItem(), userId, contentId: content.id, feedId };
    });

    const addItemsResult = await ItemRepository.createItems(newItems);

    if (!addItemsResult.success) {
        logger.error(`failed to add items to user with id ${userId}`);
        return Result.error("Failed to add items to user", "InternalError");
    }

    return Result.okEmpty();
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

    const contentToCreate = parseResult.data.items.map(parsedItem => {
        return ContentMapper.parseItemToCreateContent(parsedItem);
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
    const feedResult = await FeedRepository.getUserFeedByInternalIdentifier(
        internalIdentifier,
        userId
    );

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

const getFeedWithItemsOrContent = async (
    internalIdentifier: string,
    userId: number
): AsyncResultType<CleanFeedWithItems | CleanFeedWithContent> => {
    const feedWithItemsResponse = await getUserFeedByInternalIdentifier(internalIdentifier, userId);

    if (!feedWithItemsResponse.success) {
        return Result.error("Could not fetch user feed", "NotFound");
    }

    const hasNoItems = feedWithItemsResponse.data.items.length === 0;

    if (hasNoItems) {
        const feedWithContentResponse = await FeedRepository.getFeedWithContentByInternalIdentifier(
            internalIdentifier
        );

        if (!feedWithContentResponse.success) {
            return Result.error("Could not get content feed by identifier", "InternalError");
        }

        return Result.ok({ ...feedWithContentResponse.data, isSubscribed: false });
    }

    return Result.ok({ ...feedWithItemsResponse.data, isSubscribed: true });
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

    const assignResult = await assignFeedItemsToUser(feedResult.data.id, userId);

    if (!assignResult.success) {
        logger.error(`Could not assign items for feed with id ${feedResult.data.id}`);
        return Result.error("Could not assign items for feed", "InternalError");
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
};
