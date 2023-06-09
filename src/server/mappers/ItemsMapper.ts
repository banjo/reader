import { ParseItem } from "@/server/services/ParseService";
import { CreateItem } from "@/shared/models/entities";

const parseItemToCreateItem = (item: ParseItem, userId: number): CreateItem => {
    return {
        description: item.description,
        imageUrl: null,
        link: item.link,
        isBookmarked: false,
        isFavorite: false,
        htmlContent: item.content,
        isRead: false,
        lastFetch: new Date(),
        pubDate: new Date(item.pubDate ?? new Date()),
        userId: userId,
        title: item.title,
        content: item.contentSnippet ?? item.content,
    };
};

export const ItemsMapper = {
    parseItemToCreateItem,
};
