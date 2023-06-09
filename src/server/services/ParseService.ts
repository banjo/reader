import createLogger from "@/server/lib/logger";
import { Result, ResultType } from "@/shared/models/result";
import RssParser from "rss-parser";

import { z } from "zod";

const rssParser = new RssParser();

const logger = createLogger("ParseService");

export const ParseItemSchema = z.object({
    title: z.string(),
    link: z.string().url(),
    pubDate: z.union([z.string(), z.null()]),
    description: z.union([z.string(), z.null()]),
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

const parseRssFeed = async (url: string): Promise<ResultType<ParseFeed>> => {
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

// const parseRssItem = (url: string): Promise<ResultType<any>> => {
//     throw new Error("Not implemented");
// };

export const ParseService = {
    parseRssFeed,
    // parseRssItem,
};
