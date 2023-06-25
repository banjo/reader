import { ParseItem } from "@/server/services/ParseService";
import { CreateItemContent } from "@/shared/models/entities";

const parseItemToCreateContent = (item: ParseItem, feedId: number): CreateItemContent => {
    return {
        content: item.contentSnippet ?? item.content,
        description: item.description ?? item.contentSnippet,
        feedId,
        htmlContent: item.content,
        imageUrl: null,
        link: item.link,
        lastFetch: new Date(),
        pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        title: item.title,
    };
};

export const ContentMapper = {
    parseItemToCreateContent,
};
