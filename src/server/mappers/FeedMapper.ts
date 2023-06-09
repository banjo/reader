import { ParseFeed } from "@/server/services/ParseService";
import { CreateFeed } from "@/shared/models/entities";

const parseFeedToCreateFeed = (feed: ParseFeed, rssUrl: string): CreateFeed => {
    return {
        description: feed.description,
        rssUrl: rssUrl,
        imageUrl: null,
        name: feed.title,
        url: feed.link,
    };
};

export const FeedMapper = { parseFeedToCreateFeed };
