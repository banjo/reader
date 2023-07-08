import createLogger from "@/server/lib/logger";
import { ContentMapper } from "@/server/mappers/ContentMapper";
import { AsyncResultType, Result } from "@/shared/models/result";
import { first, sortBy } from "@banjoanton/utils";
import { ItemContent, Prisma } from "@prisma/client";
import getFavicons from "get-website-favicon";
import RssParser from "rss-parser";

import { z } from "zod";

const rssParser = new RssParser();

const logger = createLogger("ParseService");

export const ParseItemSchema = z.object({
    title: z.string(),
    link: z.string().url(),
    pubDate: z.union([z.string(), z.null()]),
    description: z.union([z.string(), z.null(), z.undefined()]),
    content: z.union([z.string(), z.null()]),
    guid: z.union([z.string(), z.null()]),
    categories: z.string().array().optional(),
    contentSnippet: z.union([z.string(), z.null()]),
});

export const ParseFeedSchema = z.object({
    title: z.string(),
    description: z.union([z.string(), z.null()]),
    link: z.string().url(),
    items: ParseItemSchema.array(),
});

export type ParseItem = z.infer<typeof ParseItemSchema>;
export type ParseFeed = z.infer<typeof ParseFeedSchema>;

const parseRssFeed = async (url: string): AsyncResultType<ParseFeed> => {
    let parsedResult;
    try {
        parsedResult = await rssParser.parseURL(url);
    } catch (error) {
        logger.error(error);
        return Result.error("Failed to parse feed", "InternalError");
    }

    if (!parsedResult) {
        return Result.error("Failed to parse feed", "InternalError");
    }

    const baseFeed = ParseFeedSchema.safeParse(parsedResult);

    if (!baseFeed.success) {
        logger.error(`Failed to parse feed with url: ${url}`, baseFeed.error);
        return Result.error("Failed to parse feed", "InternalError");
    }

    logger.info(`Successfully parsed feed with url: ${url}`);

    return Result.ok(baseFeed.data);
};

const IconSchema = z.object({
    src: z.string().url(),
    sizes: z.string(),
    type: z.string(),
    origin: z.string(),
    rank: z.number(),
});

const WebsiteSchema = z.object({
    url: z.string().url(),
    baseUrl: z.string().url(),
    originUrl: z.string().url(),
    icons: z.array(IconSchema),
});

const parseFavicon = async (url: string): AsyncResultType<string> => {
    try {
        const faviconResponse = await getFavicons(url);

        if (!faviconResponse) {
            return Result.error("Failed to parse favicon", "InternalError");
        }

        const baseFavicon = WebsiteSchema.safeParse(faviconResponse);

        if (!baseFavicon.success) {
            logger.error(`Failed to parse favicon with url: ${url}`, baseFavicon.error);
            return Result.error("Failed to parse favicon", "InternalError");
        }

        logger.info(`Successfully parsed favicon with url: ${url}`);

        const sorted = sortBy(baseFavicon.data.icons, "rank");

        if (sorted[0].rank > 100) {
            return Result.error("Failed to parse favicon", "NotFound");
        }

        return Result.ok(sorted[0].src);
    } catch (error) {
        logger.error(error);
        return Result.error("Failed to parse favicon", "InternalError");
    }
};

const shouldParseAgain = async (
    currentContent: ItemContent[],
    url: string
): Promise<Prisma.ItemContentCreateManyFeedInput[] | null> => {
    const newFeed = await parseRssFeed(url);

    if (!newFeed.success) {
        logger.error(`Failed to parse feed with url: ${url}`, newFeed.message);
        return null;
    }

    const latestFeed = newFeed.data;

    if (latestFeed.items.length === 0) {
        logger.error(`Feed with url: ${url} has no items`);
        return null;
    }

    const firstItem = first(latestFeed.items);

    if (!firstItem || !firstItem.pubDate) {
        logger.error(`Feed with url: ${url} has no items`);
        return null;
    }

    // TODO: pubDate or created at?
    const latestContent = first(sortBy(currentContent, "createdAt"));

    // TODO: better logic for getting latest?
    if (latestContent.title === firstItem.title) {
        return null;
    }

    const contentToCreate = latestFeed.items
        .filter(item => currentContent.every(contentItem => contentItem.link !== item.link))
        .map(parsedItem => {
            return ContentMapper.parseItemToCreateContent(parsedItem);
        });

    logger.info(`Feed with url: ${url} has new items`);
    return contentToCreate;
};

// const parseRssItem = (url: string): AsyncResultType<any> => {
//     throw new Error("Not implemented");
// };

export const ParseService = {
    parseRssFeed,
    parseFavicon,
    shouldParseAgain,
    // parseRssItem,
};