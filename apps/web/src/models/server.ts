// copy of server models without having to import the whole server
export type SearchFeed = {
    description: string | null;
    imageUrl: string | null;
    name: string;
    rssUrl: string;
    url: string;
    internalIdentifier: string;
};
