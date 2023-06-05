import { CleanFeed, CleanUser } from "@/models/entities";
import { Feed, Item, User } from "@prisma/client";

const feed = (feed: Feed): CleanFeed => ({
    id: feed.id,
    name: feed.name,
    link: feed.link,
    imageUrl: feed.imageUrl,
    publicUrl: feed.publicUrl,
    createdAt: feed.createdAt,
    updatedAt: feed.updatedAt,
});

const feeds = (feeds: Feed[]): CleanFeed[] => feeds.map(element => feed(element));

const user = (user: User): CleanUser => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

const users = (users: User[]): CleanUser[] => users.map(element => user(element));

const item = (item: Item): Omit<Item, "feedId" | "userId"> => ({
    id: item.id,
    hasRead: item.hasRead,
    hasBookmarked: item.hasBookmarked,
    title: item.title,
    link: item.link,
    content: item.content,
    html: item.html,
    lastFetch: item.lastFetch,
    pubDate: item.pubDate,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
});

const items = (items: Item[]): Omit<Item, "feedId" | "userId">[] =>
    items.map(element => item(element));

export const DatabaseMapper = {
    feed,
    feeds,
    user,
    users,
    item,
    items,
};
