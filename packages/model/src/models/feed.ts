export type SearchFeed = {
    description: string | null;
    imageUrl: string | null;
    name: string;
    rssUrl: string;
    url: string;
    internalIdentifier: string;
};

export const feedSearchLimit = 20;
