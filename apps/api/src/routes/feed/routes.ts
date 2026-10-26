import { createHonoInstance } from "@app/instance";
import { parseFilters, parsePagination } from "@app/utils";
import { zValidator } from "@hono/zod-validator";
import { feedImportLimit, PaginationResponse } from "model";
import { FeedImportService, FeedService } from "server";
import { bodyLimit } from "hono/body-limit";
import { Result, createLogger } from "utils";
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
        totalItemsCount: feed.totalItemsCount,
        totalItemsUnreadCount: feed.totalItemsUnreadCount,
        bookmarkedItemsUnreadCount: feed.bookmarkedItemsUnreadCount,
        favoriteItemsUnreadCount: feed.favoriteItemsUnreadCount,
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

const feedMarkAllAsReadSchema = z.object({
    feedId: z.number(),
});

feed.post("/mark-all-as-read", zValidator("json", feedMarkAllAsReadSchema), async c => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const id = body.feedId;

    const response = await FeedService.markAllAsRead(id, userId);

    if (!response.success) {
        logger.error(`Could not mark all as read for feed ${id} for user ${userId}`);
        return c.json(Result.error(response.message, response.type));
    }

    return c.json(Result.okEmpty());
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
    const pagination = parsePagination(c);
    const filter = parseFilters(c);

    // TODO: promise.all for feed and item count
    const feedResult = await FeedService.getFeedWithItemsOrContent({
        internalIdentifier,
        userId,
        pagination,
        filter,
    });

    if (!feedResult.success) {
        logger.error(`Could not find feed with internal identifier ${internalIdentifier}`);
        return c.json(Result.error(feedResult.message, feedResult.type));
    }

    const totalItemsCount = feedResult.data.isSubscribed
        ? await FeedService.getFeedItemsCount({ internalIdentifier, userId, filter })
        : await FeedService.getFeedContentCount(internalIdentifier);

    if (!totalItemsCount.success) {
        logger.error(
            `Could not fetch items count for feed with internal identifier ${internalIdentifier}`
        );
        return c.json(Result.error(totalItemsCount.message, totalItemsCount.type));
    }

    const paginationResponse = PaginationResponse.from(
        pagination,
        totalItemsCount.data,
        feedResult.data
    );

    return c.json(Result.ok(paginationResponse));
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
    urls: z
        .array(
            z
                .string()
                .trim()
                .max(2_048)
                .url()
                .refine(url => /^https?:\/\//i.test(url))
        )
        .min(1)
        .max(feedImportLimit),
});

feed.post(
    "/add-many",
    bodyLimit({ maxSize: 3 * 1024 * 1024 }),
    zValidator("json", feedAddManyBodySchema),
    async c => {
        const userId = c.get("userId");
        const body = c.req.valid("json");

        const result = await FeedImportService.enqueue({ urls: body.urls, userId });
        if (!result.success) {
            return c.json(result, result.status);
        }
        return c.json(result, 202);
    }
);

feed.get(
    "/imports/:importId",
    zValidator("param", z.object({ importId: z.string().uuid() })),
    async c => {
        const { importId } = c.req.valid("param");
        const result = await FeedImportService.getStatus({ importId, userId: c.get("userId") });
        c.header("Cache-Control", "no-store");
        if (!result.success) {
            return c.json(result, result.status);
        }
        return c.json(result);
    }
);
