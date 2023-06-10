import { ParseFeed } from "@/server/services/ParseService";
import { CreateFeed, FeedWithUser, SearchFeed } from "@/shared/models/entities";
import { Feed } from "@prisma/client";

const parseFeedToCreateFeed = (feed: ParseFeed, rssUrl: string): CreateFeed => {
    return {
        description: feed.description,
        rssUrl: rssUrl,
        imageUrl: null,
        name: feed.title,
        url: feed.link,
    };
};

const feedToSearchFeed = (feed: Feed | FeedWithUser): SearchFeed => {
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
