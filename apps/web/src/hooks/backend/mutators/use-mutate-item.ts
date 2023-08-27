import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useInvalidate } from "@/hooks/backend/use-invalidate";
import { useMutation } from "@tanstack/react-query";
import { CleanFeedWithContent, CleanFeedWithItems, ItemWithContent } from "db";

type MutateContext = {
    item: ItemWithContent;
};

const isItemWithContentArray = (data: any): data is ItemWithContent[] => {
    return Array.isArray(data) && data[0].content;
};

const isCleanFeedWithItems = (data: any): data is CleanFeedWithItems => {
    return data?.items && data?.items?.[0]?.content;
};

const isCleanFeedWithContent = (data: any): data is CleanFeedWithContent => {
    return data?.content;
};

const isCleanFeedWithItemsArray = (data: any): data is CleanFeedWithItems[] => {
    return Array.isArray(data) && data[0]?.items && data[0]?.items?.[0]?.content;
};

export const useMutateItem = () => {
    const api = useAuthFetcher();
    const { cancelQueries, queryClient, refetch } = useInvalidate();

    const optimisticUpdateItemWithContent = (
        c: MutateContext,
        handler: (item: ItemWithContent) => ItemWithContent
    ) => {
        const previousItems = queryClient.getQueryData(["items"]);

        queryClient.setQueriesData(["items"], (old: any) => {
            const oldContent:
                | ItemWithContent[]
                | CleanFeedWithItems[]
                | CleanFeedWithItems
                | CleanFeedWithContent = old;

            if (isCleanFeedWithContent(oldContent)) {
                // feed with content cannot update read status, bookmark status, etc.
                return oldContent;
            }

            if (isItemWithContentArray(oldContent)) {
                return oldContent.map((i: ItemWithContent) => {
                    if (i.id === c.item.id) {
                        return handler(i);
                    }
                    return i;
                });
            }

            if (isCleanFeedWithItemsArray(oldContent)) {
                return oldContent.map((feed: CleanFeedWithItems) => {
                    return {
                        ...feed,
                        items: feed.items.map((i: ItemWithContent) => {
                            if (i.id === c.item.id) {
                                return handler(i);
                            }
                            return i;
                        }),
                    };
                });
            }

            if (isCleanFeedWithItems(oldContent)) {
                return {
                    ...oldContent,
                    items: oldContent.items.map((i: ItemWithContent) => {
                        if (i.id === c.item.id) {
                            return handler(i);
                        }
                        return i;
                    }),
                };
            }
        });

        return previousItems;
    };

    const mutateIsRead = useMutation({
        mutationFn: async ({ item }: MutateContext) => {
            await api.PUT(`/item/${item.id}`, {
                ...item,
                isRead: !item.isRead,
            });
        },
        onMutate: async (c: MutateContext) => {
            cancelQueries();

            const previousItems = optimisticUpdateItemWithContent(c, (item: ItemWithContent) => {
                return {
                    ...item,
                    isRead: !item.isRead,
                };
            });

            return { previousItems };
        },
        onError: (err, c, context) => {
            queryClient.setQueryData(["items"], context?.previousItems);
        },
        onSettled: () => {
            refetch();
        },
    });

    const toggleReadStatus = (item: ItemWithContent) => {
        mutateIsRead.mutate({ item });
    };

    const mutateBookmarkStatus = useMutation({
        mutationFn: async ({ item }: MutateContext) => {
            await api.PUT(`/item/${item.id}`, {
                ...item,
                isBookmarked: !item.isBookmarked,
            });
        },
        onMutate: async (c: MutateContext) => {
            cancelQueries();

            const previousItems = optimisticUpdateItemWithContent(c, (item: ItemWithContent) => {
                return {
                    ...item,
                    isBookmarked: !item.isBookmarked,
                };
            });

            return { previousItems };
        },
        onError: (err, c, context) => {
            queryClient.setQueryData(["items"], context?.previousItems);
        },
        onSettled: () => {
            refetch();
        },
    });

    const toggleBookmarkStatus = (item: ItemWithContent) => {
        mutateBookmarkStatus.mutate({ item });
    };

    const mutateFavoriteStatus = useMutation({
        mutationFn: async ({ item }: MutateContext) =>
            await api.PUT(`/item/${item.id}`, {
                ...item,
                isFavorite: !item.isFavorite,
            }),
        onMutate: async (c: MutateContext) => {
            cancelQueries();

            const previousItems = optimisticUpdateItemWithContent(c, (item: ItemWithContent) => {
                return {
                    ...item,
                    isFavorite: !item.isFavorite,
                };
            });

            return { previousItems };
        },
        onError: (err, c, context) => {
            queryClient.setQueryData(["items"], context?.previousItems);
        },
        onSettled: () => {
            refetch();
        },
    });

    const toggleFavoriteStatus = (item: ItemWithContent) => {
        mutateFavoriteStatus.mutate({ item });
    };

    const mutateMultipleAsRead = useMutation({
        mutationFn: async (items: ItemWithContent[]) =>
            await api.POST(`/items/read`, {
                ids: items.map(i => i.id),
            }),
        onMutate: async (items: ItemWithContent[]) => {
            cancelQueries();

            const previousItems = queryClient.getQueryData(["items"]);

            queryClient.setQueriesData(["items"], (old: any) => {
                const oldContent:
                    | ItemWithContent[]
                    | CleanFeedWithItems[]
                    | CleanFeedWithItems
                    | CleanFeedWithContent = old;

                if (isCleanFeedWithContent(oldContent)) {
                    // feed with content cannot update read status, bookmark status, etc.
                    return oldContent;
                }

                if (isItemWithContentArray(oldContent)) {
                    return oldContent.map((i: ItemWithContent) => {
                        return {
                            ...i,
                            isRead: true,
                        };
                    });
                }

                if (isCleanFeedWithItemsArray(oldContent)) {
                    return oldContent.map((feed: CleanFeedWithItems) => {
                        return {
                            ...feed,
                            items: feed.items.map((i: ItemWithContent) => {
                                return {
                                    ...i,
                                    isRead: true,
                                };
                            }),
                        };
                    });
                }

                if (isCleanFeedWithItems(oldContent)) {
                    return {
                        ...oldContent,
                        items: oldContent.items.map((i: ItemWithContent) => {
                            return {
                                ...i,
                                isRead: true,
                            };
                        }),
                    };
                }
            });

            return { previousItems };
        },
        onError: (err, c, context) => {
            queryClient.setQueryData(["items"], context?.previousItems);
        },
        onSettled: () => {
            refetch();
        },
    });

    const markMultipleAsRead = (items: ItemWithContent[]) => {
        mutateMultipleAsRead.mutate(items);
    };

    return {
        toggleReadStatus,
        toggleBookmarkStatus,
        toggleFavoriteStatus,
        markMultipleAsRead,
    };
};
