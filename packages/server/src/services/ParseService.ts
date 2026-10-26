import { Prisma } from "db";
import { parseHTML } from "linkedom";
import { AsyncResultType } from "model";
import RssParser from "rss-parser";
import { Result, createLogger } from "utils";
import { z } from "zod";
import { ContentMapper } from "../mappers/ContentMapper";
import { FeedRefresh } from "../shared/lib/feed-refresh";

const rssParser = new RssParser();

const logger = createLogger("ParseService");

const postLinkSchema = z
    .string()
    .trim()
    .url()
    .refine(link => /^https?:\/\//i.test(link));

const prepareItem = (input: unknown): unknown => {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return input;
    }

    const item = input as Record<string, unknown>;
    const title = typeof item.title === "string" ? item.title.trim() : "";
    const description = [item.description, item.contentSnippet, item.content].find(
        value => typeof value === "string" && value.trim()
    );
    const fallbackTitle =
        !title && typeof description === "string"
            ? parseHTML(`<html><body>${description}</body></html>`)
                  .document.body.textContent.replace(/\s+/g, " ")
                  .trim()
                  .slice(0, 120)
            : "";
    const link = [item.link, item.guid].find(value => postLinkSchema.safeParse(value).success);
    const pubDate = [item.isoDate, item.pubDate].find(
        value => typeof value === "string" && Number.isFinite(Date.parse(value))
    );

    return {
        ...item,
        title: title || fallbackTitle,
        link,
        pubDate: pubDate ?? null,
    };
};

export const ParseItemSchema = z.preprocess(
    prepareItem,
    z.object({
        title: z.string().trim().min(1),
        link: postLinkSchema,
        pubDate: z.string().nullable(),
        description: z.string().optional(),
        content: z.string().optional(),
        guid: z.string().optional(),
        categories: z.string().array().optional(),
        contentSnippet: z.string().optional(),
    })
);

export const ParseFeedSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    link: z.string().url(),
    items: ParseItemSchema.array(),
});

export type ParseItem = z.infer<typeof ParseItemSchema>;
export type ParseFeed = z.infer<typeof ParseFeedSchema>;

type ShouldParseAgainProps = {
    currentLinks: Set<string>;
    url: string;
};

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

    const baseFeed = ParseFeedSchema.omit({ items: true }).safeParse(parsedResult);

    if (!baseFeed.success) {
        logger.error({ issues: baseFeed.error.issues }, `Failed to parse feed with url: ${url}`);
        return Result.error("Failed to parse feed", "InternalError");
    }

    const items: ParseItem[] = [];
    const links = new Set<string>();
    for (const [index, rawItem] of parsedResult.items.entries()) {
        const item = ParseItemSchema.safeParse(rawItem);
        if (!item.success) {
            logger.warn({ url, index, issues: item.error.issues }, "Skipping invalid RSS post");
            continue;
        }
        if (links.has(item.data.link)) {
            continue;
        }
        links.add(item.data.link);
        items.push(item.data);
    }

    logger.info(`Successfully parsed feed with url: ${url}`);

    return Result.ok({ ...baseFeed.data, items });
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

const shouldParseAgain = async ({
    currentLinks,
    url,
}: ShouldParseAgainProps): AsyncResultType<Prisma.ItemContentCreateManyFeedInput[]> => {
    const newFeed = await parseRssFeed(url);

    if (!newFeed.success) {
        logger.error(`Failed to parse feed with url: ${url} - ${newFeed.message}`);
        return Result.error(newFeed.message, newFeed.type);
    }

    const contentToCreate = FeedRefresh.selectNewFeedItems({
        items: newFeed.data.items,
        currentLinks,
    }).map(ContentMapper.parseItemToCreateContent);

    return Result.ok(contentToCreate);
};

export const ParseService = {
    parseRssFeed,
    parseFavicon,
    parseImage,
    shouldParseAgain,
};
