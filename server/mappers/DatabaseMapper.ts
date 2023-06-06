import { CleanFeedWithItems, CleanUser, FeedWithItems } from "@/models/entities";
import { Item, User } from "@prisma/client";

function item(item: Item): Omit<Item, "feedId" | "userId"> {
    return {
        id: item.id,
        isRead: item.isRead,
        isBookmarked: item.isBookmarked,
        isFavorite: item.isFavorite,
        image: item.image,
        title: item.title,
        link: item.link,
        content: item.content,
        description: item.description,
        html: item.html,
        lastFetch: item.lastFetch,
        pubDate: item.pubDate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    };
}

function items(items: Item[]): Omit<Item, "feedId" | "userId">[] {
    return items.map(element => item(element));
}

function feed(feed: FeedWithItems): CleanFeedWithItems {
    return {
        id: feed.id,
        name: feed.name,
        link: feed.link,
        imageUrl: feed.imageUrl,
        publicUrl: feed.publicUrl,
        createdAt: feed.createdAt,
        updatedAt: feed.updatedAt,
        items: feed.items ? items(feed.items) : [],
    };
}

function feeds(feeds: FeedWithItems[]): CleanFeedWithItems[] {
    return feeds.map(element => feed(element));
}

function user(user: User): CleanUser {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

function users(users: User[]): CleanUser[] {
    return users.map(element => user(element));
}

export const DatabaseMapper = {
    feed,
    feeds,
    user,
    users,
    item,
    items,
};
