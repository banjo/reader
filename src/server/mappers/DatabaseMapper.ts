import {
    CleanFeedWithItems,
    CleanItem,
    CleanUser,
    CompleteItem,
    FeedWithItems,
} from "@/shared/models/entities";
import { User } from "@prisma/client";

function item(item: CompleteItem): CleanItem {
    return {
        id: item.id,
        isRead: item.isRead,
        isBookmarked: item.isBookmarked,
        isFavorite: item.isFavorite,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        content: item.content,
        feed: item.feed,
    };
}

function items(items: CompleteItem[]): CleanItem[] {
    return items.map(element => item(element));
}

function feed(feed: FeedWithItems, isSubscribed: boolean): CleanFeedWithItems {
    return {
        id: feed.id,
        name: feed.name,
        imageUrl: feed.imageUrl,
        internalIdentifier: feed.internalIdentifier,
        createdAt: feed.createdAt,
        rssUrl: feed.rssUrl,
        url: feed.url,
        description: feed.description,
        updatedAt: feed.updatedAt,
        items: feed.items.length > 0 ? items(feed.items) : [],
        isSubscribed,
    };
}

function feeds(feeds: FeedWithItems[], isSubscribed: boolean): CleanFeedWithItems[] {
    return feeds.map(element => feed(element, isSubscribed));
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
