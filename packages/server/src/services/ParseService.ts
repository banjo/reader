import { Prisma } from "db";
import { parseHTML } from "linkedom";
import { ResultType } from "model";
import RssParser from "rss-parser";
import { createLogger, Result } from "utils";
import { z } from "zod";
import { ContentMapper } from "../mappers/ContentMapper";
import { FeedRefresh } from "../shared/lib/feed-refresh";
import {
    ExternalRequestError,
    externalRequestLimits,
    ExternalRequestService,
} from "./ExternalRequestService";

const rssParser = new RssParser({ timeout: 15_000, maxRedirects: 3 });

type ParseResult<T> = Promise<ResultType<T> & { retryable?: boolean; statusCode?: number }>;
type ParseOptions = { attempts?: number };
type ParseArticleOptions = ParseOptions & { siteName?: string };
type ImageError = { success: boolean; retryable?: boolean; statusCode?: number };

export type ArticleMetadata = {
    title?: string;
    description?: string;
    imageUrl?: string;
};

const requestFailure = <T>(
    error: unknown
): ResultType<T> & { retryable: boolean; statusCode?: number } => ({
    ...Result.error<T>(
        error instanceof Error ? error.message : "External request failed",
        "InternalError"
    ),
    retryable: error instanceof ExternalRequestError && error.retryable,
    statusCode: error instanceof ExternalRequestError ? error.statusCode : undefined,
});

const isClearableImageError = (result: ImageError) => {
    if (result.success || result.retryable) {
        return false;
    }

    const status = result.statusCode;
    return (
        status === undefined || status === 404 || status === 410 || (status >= 200 && status < 300)
    );
};

const logger = createLogger("ParseService");

const postLinkSchema = z
    .string()
    .trim()
    .url()
    .refine(link => /^https?:\/\//i.test(link));

const cleanTitle = (title: string, siteName?: string) => {
    const normalized = title.replace(/\s+/g, " ").trim();
    if (!siteName) {
        return normalized;
    }

    const escaped = siteName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return normalized
        .replace(new RegExp(`\\s*[|\\-–—]\\s*${escaped}\\s*$`, "i"), "")
        .replace(new RegExp(`^\\s*${escaped}\\s*[|\\-–—]\\s*`, "i"), "")
        .trim();
};

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
    attempts?: number;
};

const parseRssFeed = async (url: string, options: ParseOptions = {}): ParseResult<ParseFeed> => {
    let parsedResult;
    try {
        const response = await ExternalRequestService.fetchText({
            url,
            ...externalRequestLimits.rss,
            ...options,
        });
        parsedResult = await rssParser.parseString(response.text);
    } catch (error) {
        logger.error(error);
        return requestFailure(error);
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

const validateImage = async (url: string, options: ParseOptions = {}): ParseResult<string> => {
    try {
        const metadata = await ExternalRequestService.fetchImageMetadata({
            url,
            ...externalRequestLimits.image,
            ...options,
        });
        return Result.ok(metadata.url);
    } catch (error) {
        logger.error(error);
        return requestFailure(error);
    }
};

const parseImage = async (url: string, options: ParseOptions = {}): ParseResult<string> => {
    try {
        const response = await ExternalRequestService.fetchText({
            url,
            ...externalRequestLimits.html,
            ...options,
        });
        const doc = parseHTML(response.text).document;

        const head = doc.querySelector("head");

        if (!head) {
            return Result.error("Failed to parse image", "NotFound");
        }

        const meta = head.querySelector("meta[property='og:image']") as HTMLMetaElement;

        if (!meta?.content?.trim()) {
            return Result.error("Failed to parse image", "NotFound");
        }

        const content = new URL(meta.content, response.url).href;
        if (!postLinkSchema.safeParse(content).success) {
            return Result.error("Invalid image URL", "NotFound");
        }

        const image = await validateImage(content, options);

        if (image.success || image.retryable || isClearableImageError(image)) {
            return image;
        }

        // Some hosts reject server-side checks but still allow the browser to load the image.
        return Result.ok(content);
    } catch (error) {
        logger.error(error);
        return requestFailure(error);
    }
};

const parseArticleMetadata = async (
    url: string,
    options: ParseArticleOptions = {}
): ParseResult<ArticleMetadata> => {
    const { siteName, ...requestOptions } = options;
    try {
        const response = await ExternalRequestService.fetchText({
            url,
            ...externalRequestLimits.html,
            ...requestOptions,
        });
        const head = parseHTML(response.text).document.querySelector("head");

        if (!head) {
            return Result.error("Failed to parse article", "NotFound");
        }

        const metaContent = (selectors: string[]) => {
            for (const selector of selectors) {
                const meta = head.querySelector(selector) as HTMLMetaElement | null;
                const content = meta?.content?.trim();
                if (content) {
                    return content;
                }
            }
            return undefined;
        };

        const rawTitle = metaContent(["meta[property='og:title']", "meta[name='twitter:title']"]);
        const description = metaContent([
            "meta[property='og:description']",
            "meta[name='description']",
            "meta[name='twitter:description']",
        ]);
        const rawImage = metaContent([
            "meta[property='og:image']",
            "meta[property='og:image:url']",
            "meta[name='twitter:image']",
        ]);

        let imageUrl: string | undefined;
        if (rawImage) {
            const content = new URL(rawImage, response.url).href;
            if (postLinkSchema.safeParse(content).success) {
                const image = await validateImage(content, requestOptions);
                if (image.success) {
                    imageUrl = image.data;
                }
            }
        }

        return Result.ok({
            title: rawTitle ? cleanTitle(rawTitle, siteName) : undefined,
            description: description?.replace(/\s+/g, " ").trim() || undefined,
            imageUrl,
        });
    } catch (error) {
        logger.error(error);
        return requestFailure(error);
    }
};

const parseFavicon = async (url: string, options: ParseOptions = {}): ParseResult<string> => {
    try {
        const response = await ExternalRequestService.fetchText({
            url,
            ...externalRequestLimits.html,
            ...options,
        });
        const doc = parseHTML(response.text).document;

        const head = doc.querySelector("head");

        if (!head) {
            return Result.error("Failed to parse favicon", "NotFound");
        }

        const link = head.querySelector("link[rel*='icon']") as HTMLLinkElement;

        if (!link?.href?.trim()) {
            return Result.error("Failed to parse favicon", "NotFound");
        }

        const href = new URL(link.href, response.url).href;
        if (!postLinkSchema.safeParse(href).success) {
            return Result.error("Invalid favicon URL", "NotFound");
        }
        return Result.ok(href);
    } catch (error) {
        logger.error(error);
        return requestFailure(error);
    }
};

const shouldParseAgain = async ({
    currentLinks,
    url,
    attempts,
}: ShouldParseAgainProps): ParseResult<Prisma.ItemContentCreateManyFeedInput[]> => {
    const newFeed = await parseRssFeed(url, { attempts });

    if (!newFeed.success) {
        logger.error(`Failed to parse feed with url: ${url} - ${newFeed.message}`);
        return newFeed;
    }

    const contentToCreate = FeedRefresh.selectNewFeedItems({
        items: newFeed.data.items,
        currentLinks,
    }).map(ContentMapper.parseItemToCreateContent);

    return Result.ok(contentToCreate);
};

export const ParseService = {
    isClearableImageError,
    parseArticleMetadata,
    parseRssFeed,
    parseFavicon,
    parseImage,
    validateImage,
    shouldParseAgain,
};
