import { first, sortBy } from "@banjoanton/utils";
import { ItemContent, Prisma } from "db";
import { parseHTML } from "linkedom";
import { AsyncResultType } from "model";
import RssParser from "rss-parser";
import { Result, createLogger } from "utils";
import { z } from "zod";
import { ContentMapper } from "../mappers/ContentMapper";
import { FeedMapper } from "../mappers/FeedMapper";

const rssParser = new RssParser();

const logger = createLogger("ParseService");

export const ParseItemSchema = z.object({
    title: z.string(),
    link: z.string().url(),
    pubDate: z.union([z.string(), z.null()]),
    description: z.string().optional(),
    content: z.string().optional(),
    guid: z.string().optional(),
    categories: z.string().array().optional(),
    contentSnippet: z.string().optional(),
});

export const ParseFeedSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
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

    const preparedResult = FeedMapper.prepareSafeParse(parsedResult);
    const baseFeed = ParseFeedSchema.safeParse(preparedResult);

    if (!baseFeed.success) {
        logger.error(`Failed to parse feed with url: ${url}`, baseFeed.error.issues);
        return Result.error("Failed to parse feed", "InternalError");
    }

    logger.info(`Successfully parsed feed with url: ${url}`);

    return Result.ok(baseFeed.data);
};

const parseImage = async (url: string): AsyncResultType<string> => {
    try {
        const html = await fetch(url).then(res => res.text());
        const doc = parseHTML(html).document;

        const head = doc.querySelector("head");

        if (!head) {
            return Result.error("Failed to parse image", "NotFound");
        }

        const meta = head.querySelector("meta[property='og:image']") as HTMLMetaElement;

        if (!meta) {
            return Result.error("Failed to parse image", "NotFound");
        }

        const content = meta.content.startsWith("/")
            ? new URL(meta.content, url).href
            : meta.content;
        return Result.ok(content);
    } catch (error) {
        logger.error(error);
        return Result.error("Failed to parse image", "InternalError");
    }
};

const parseFavicon = async (url: string): AsyncResultType<string> => {
    try {
        const html = await fetch(url).then(res => res.text());
        const doc = parseHTML(html).document;

        const head = doc.querySelector("head");

        if (!head) {
            return Result.error("Failed to parse favicon", "NotFound");
        }

        const link = head.querySelector("link[rel*='icon']") as HTMLLinkElement;

        if (!link) {
            return Result.error("Failed to parse favicon", "NotFound");
        }

        const href = link.href.startsWith("/") ? new URL(link.href, url).href : link.href;
        return Result.ok(href);
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

    const latestNewItem = first(latestFeed.items);

    if (!latestNewItem || !latestNewItem.pubDate) {
        logger.error(`Feed with url: ${url} has no items`);
        return null;
    }

    // TODO: pubDate or created at?
    const latestCurrentContent = first(sortBy(currentContent, "createdAt"));

    // TODO: better logic for getting latest?
    if (latestCurrentContent?.title === latestNewItem?.title) {
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

export const ParseService = {
    parseRssFeed,
    parseFavicon,
    parseImage,
    shouldParseAgain,
};
