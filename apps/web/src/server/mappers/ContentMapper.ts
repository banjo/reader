import { ParseItem } from "@/server/services/ParseService";
import { Prisma } from "@prisma/client";

const parseItemToCreateContent = (item: ParseItem): Prisma.ItemContentCreateManyFeedInput => {
    return {
        content: item.contentSnippet ?? item.content,
        description: item.description ?? item.contentSnippet,
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
