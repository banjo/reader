import { ParseFeed } from "@/server/services/ParseService";
import { FeedWithUsers } from "@/shared/models/types";
import { Feed, Prisma } from "@prisma/client";

const parseFeedToCreateFeed = (feed: ParseFeed, rssUrl: string): Prisma.FeedCreateInput => {
    return {
        description: feed.description,
        rssUrl: rssUrl,
        imageUrl: null,
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
