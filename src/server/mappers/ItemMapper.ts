import { ParseItem } from "@/server/services/ParseService";
import { CreateItem } from "@/shared/models/entities";
import { Item } from "@prisma/client";

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

const itemToCreateItem = (item: Item, userId: number): CreateItem => {
    return {
        description: item.description,
        imageUrl: item.imageUrl,
        link: item.link,
        isBookmarked: false,
        htmlContent: item.htmlContent,
        isFavorite: false,
        isRead: false,
        lastFetch: item.lastFetch,
        pubDate: item.pubDate,
        userId: userId,
        title: item.title,
        content: item.content,
    };
};

export const ItemMapper = {
    parseItemToCreateItem,
    itemToCreateItem,
};
