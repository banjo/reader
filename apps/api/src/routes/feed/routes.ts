import { createHonoInstance } from "@app/instance";
import { zValidator } from "@hono/zod-validator";
import { FeedService } from "server";
import { createLogger, Result } from "utils";
import { z } from "zod";

export const feed = createHonoInstance();
const logger = createLogger("api:feed");

feed.get("/", async c => {
    const userId = c.get("userId");

    logger.info(`Fetching feeds for user ${userId}`);

    const feedResponse = await FeedService.getAllFeedsByUserId(userId);

    if (!feedResponse.success) {
        logger.error(`Could not fetch feeds for user ${userId}`);
        return c.json(Result.error(feedResponse.message, feedResponse.type));
    }

    const returnObject = feedResponse.data.map(feed => ({
        title: feed.name,
        imageUrl: feed.imageUrl,
        internalIdentifier: feed.internalIdentifier,
        totalItemsCount: feed.items.length,
        unreadItemsCount: feed.items.filter(item => !item.isRead).length,
        bookmarkedItemsCount: feed.items.filter(item => item.isBookmarked).length,
        favoriteItemsCount: feed.items.filter(item => item.isFavorite).length,
    }));

    return c.json(Result.ok(returnObject));
});

const feedPostSchema = z.object({
    url: z.string().url(),
});

feed.post("/", zValidator("json", feedPostSchema), async c => {
    const userId = c.get("userId");
    const body = c.req.valid("json");

    const item = await FeedService.addFeed(body.url, userId);

    if (!item.success) {
        logger.error(`Could not fetch feed with url ${body.url} for user ${userId}`);
        return c.text(item.message, item.status);
    }

    return c.json(Result.ok(item.data));
});

const feedSearchQuerySchema = z.object({
    query: z.string(),
});

feed.get("/search", zValidator("query", feedSearchQuerySchema), async c => {
    const { query } = c.req.valid("query");
    const userId = c.get("userId");

    const item = await FeedService.searchFeeds(query, userId);

    if (!item.success) {
        logger.error(`Could not search for feeds with query ${query} for user ${userId}`);
        return c.json(Result.error(item.message, item.type));
    }

    return c.json(Result.ok(item.data));
});

feed.get("/:internalIdentifier", async c => {
    const internalIdentifier = c.req.param("internalIdentifier");
    const userId = c.get("userId");

    const feedResult = await FeedService.getFeedWithItemsOrContent(internalIdentifier, userId);

    if (!feedResult.success) {
        logger.error(`Could not find feed with internal identifier ${internalIdentifier}`);

        return c.json(Result.error(feedResult.message, feedResult.type));
    }

    return c.json(Result.ok(feedResult.data));
});

feed.post("/:internalIdentifier/unsubscribe", async c => {
    const userId = c.get("userId");
    const internalIdentifier = c.req.param("internalIdentifier");

    const item = await FeedService.unsubscribeFromFeed(internalIdentifier, userId);

    if (!item.success) {
        logger.error(
            `Could not unsubscribe from feed with internal identifier ${internalIdentifier} for user ${userId}`
        );
        return c.json(Result.error(item.message, item.type));
    }

    return c.json(Result.ok(item.data));
});

feed.post("/:internalIdentifier/subscribe", async c => {
    const userId = c.get("userId");
    const internalIdentifier = c.req.param("internalIdentifier");

    const item = await FeedService.subscribeToFeed(internalIdentifier, userId);

    if (!item.success) {
        logger.error(
            `Could not subscribe to feed with internal identifier ${internalIdentifier} for user ${userId}`
        );
        return c.json(Result.error(item.message, item.type));
    }

    return c.json(Result.ok(item.data));
});

const feedAddManyBodySchema = z.object({
    urls: z.string().array(),
});

feed.post("/add-many", zValidator("json", feedAddManyBodySchema), async c => {
    const userId = c.get("userId");
    const body = c.req.valid("json");

    const results = await Promise.allSettled(
        body.urls.map(url => FeedService.addFeed(url, userId))
    );

    const total = results.length;
    const success = results.filter(result => result.status === "fulfilled").length;

    const errors = results
        .filter(result => result.status === "rejected")
        .map(r => {
            const result = r as PromiseRejectedResult;

            return {
                url: result.reason.url,
                message: result.reason.message,
                type: result.reason.type,
            };
        });

    return c.json(Result.ok({ total, success, errors }));
});
