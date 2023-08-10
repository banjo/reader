import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useInvalidate } from "@/hooks/backend/use-invalidate";
import { useMutation } from "@tanstack/react-query";
import { ItemWithContent } from "db";

export const useMutateItem = () => {
    const api = useAuthFetcher();
    const { invalidate } = useInvalidate();

    const mutateIsRead = useMutation({
        mutationFn: async (item: ItemWithContent) => {
            await api.PUT(`/item/${item.id}`, {
                ...item,
                isRead: !item.isRead,
            });
        },
        onSuccess: () => {
            invalidate();
        },
    });

    const toggleReadStatus = (item: ItemWithContent) => {
        mutateIsRead.mutate(item);
    };

    const mutateBookmarkStatus = useMutation({
        mutationFn: async (item: ItemWithContent) => {
            await api.PUT(`/item/${item.id}`, {
                ...item,
                isBookmarked: !item.isBookmarked,
            });
        },
        onSuccess: () => {
            invalidate();
        },
    });

    const toggleBookmarkStatus = (item: ItemWithContent) => {
        mutateBookmarkStatus.mutate(item);
    };

    const mutateFavoriteStatus = useMutation({
        mutationFn: async (item: ItemWithContent) =>
            await api.PUT(`/item/${item.id}`, {
                ...item,
                isFavorite: !item.isFavorite,
            }),
        onSuccess: () => {
            invalidate();
        },
    });

    const toggleFavoriteStatus = (item: ItemWithContent) => {
        mutateFavoriteStatus.mutate(item);
    };

    const mutateMulitpleAsRead = useMutation({
        mutationFn: async (items: ItemWithContent[]) =>
            await api.POST(`/items/read`, {
                ids: items.map(i => i.id),
            }),
        onSuccess: () => {
            invalidate();
        },
    });

    const markMultipleAsRead = (items: ItemWithContent[]) => {
        mutateMulitpleAsRead.mutate(items);
    };

    return {
        toggleReadStatus,
        toggleBookmarkStatus,
        toggleFavoriteStatus,
        markMultipleAsRead,
    };
};
