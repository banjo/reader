import createLogger from "@/server/lib/logger";
import { Result, ResultType } from "@/shared/models/result";
import RssParser from "rss-parser";

import { z } from "zod";

const rssParser = new RssParser();

const logger = createLogger("ParseService");

const baseItemSchema = z.object({
    title: z.string(),
    link: z.string().url(),
    pubDate: z.string().optional(),
    description: z.string().optional(),
    content: z.string().optional(),
    guid: z.string().optional(),
    categories: z.string().array().optional(),
    contentSnippet: z.string().optional(),
});

const baseFeedSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    link: z.string().url(),
    items: baseItemSchema.array(),
});

type BaseFeed = z.infer<typeof baseFeedSchema>;

const parseRssFeed = async (url: string): Promise<ResultType<BaseFeed>> => {
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

    const baseFeed = baseFeedSchema.safeParse(parsedResult);

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
