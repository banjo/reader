import { CleanFeedWithItems, ItemWithContent } from "db";
import { mutate } from "swr";

const KEY = "/feed";

const mutateSidebarFeed = (item: CleanFeedWithItems) => {
    mutate<CleanFeedWithItems[]>(
        KEY,
        previous => {
            if (!previous) {
                return;
            }
            // eslint-disable-next-line consistent-return
            return previous.map(feed => {
                if (feed.id === item.id) {
                    return item;
                }
                return feed;
            });
        },
        false
    );
};

const mutateSidebarItem = (item: ItemWithContent) => {
    mutate<CleanFeedWithItems[]>(
        KEY,
        previous => {
            if (!previous) {
                return;
            }
            // eslint-disable-next-line consistent-return
            return previous.map(feed => {
                const updatedFeed = {
                    ...feed,
                    items: feed.items.map(i => {
                        if (i.id === item.id) {
                            return item;
                        }
                        return i;
                    }),
                };
                return updatedFeed;
            });
        },
        false
    );
};

const mutateSidebarItems = (items: ItemWithContent[]) => {
    mutate<CleanFeedWithItems[]>(
        KEY,
        previous => {
            if (!previous) {
                return;
            }
            // eslint-disable-next-line consistent-return
            return previous.map(feed => {
                const updatedFeed = {
                    ...feed,
                    items: feed.items.map(i => {
                        const updatedItem = items.find(ui => ui.id === i.id);

                        if (updatedItem) {
                            return updatedItem;
                        }

                        return i;
                    }),
                };
                return updatedFeed;
            });
        },
        false
    );
};

const fetchLatestInSidebar = () => {
    mutate(KEY);
};

export const useUpdateSidebar = () => {
    return {
        mutateSidebarFeed,
        fetchLatestInSidebar,
        mutateSidebarItem,
        mutateSidebarItems,
    };
};
