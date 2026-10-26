import { Prisma } from "db";
import { ParseFeed } from "../services/ParseService";

const parseFeedToCreateFeed = (
    feed: ParseFeed,
    rssUrl: string,
    faviconUrl?: string
): Prisma.FeedCreateManyInput => {
    return {
        description: feed.description,
        rssUrl: rssUrl,
        imageUrl: faviconUrl ?? null,
        name: feed.title,
        url: feed.link,
    };
};

export const FeedMapper = { parseFeedToCreateFeed };
