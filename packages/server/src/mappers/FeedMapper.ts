import { Feed, FeedWithUsers, Prisma } from "db";
import { ParseFeed } from "../services/ParseService";
import { ItemMapper } from "./ItemMapper";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prepareSafeParse = (feed: any) => {
    return {
        ...feed,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: feed.items.map((item: any) => {
            return ItemMapper.prepareSafeParse(item);
        }),
    };
};

export const FeedMapper = { parseFeedToCreateFeed, feedToSearchFeed, prepareSafeParse };
