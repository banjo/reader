import { Feed, FeedWithUsers, Prisma } from "db";
import { ParseFeed } from "../services/ParseService";

const parseFeedToCreateFeed = (
    feed: ParseFeed,
    rssUrl: string,
    faviconUrl?: string
): Prisma.FeedCreateInput => {
    return {
        description: feed.description,
        rssUrl: rssUrl,
        imageUrl: faviconUrl ?? null,
        name: feed.title,
        url: feed.link,
    };
};

// TODO: better type system or change to generic type?
export type SearchFeed = {
    description: string | null;
    imageUrl: string | null;
    name: string;
    rssUrl: string;
    url: string;
    internalIdentifier: string;
};

const feedToSearchFeed = (feed: Feed | FeedWithUsers): SearchFeed => {
    return {
        description: feed.description,
        imageUrl: feed.imageUrl,
        name: feed.name,
        rssUrl: feed.rssUrl,
        url: feed.url,
        internalIdentifier: feed.internalIdentifier,
    };
};

export const FeedMapper = { parseFeedToCreateFeed, feedToSearchFeed };
