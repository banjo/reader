import { useAuth } from "@/client/hooks/backend/use-auth";
import { fetcher } from "@/client/lib/fetcher";
import { CleanItem } from "@/shared/models/entities";
import { Refetch } from "@/shared/models/swr";
import { toast } from "react-hot-toast";

type In<T> = {
    refetch: Refetch<T[]>;
};

export const useMutateItem = <T extends CleanItem>({ refetch }: In<T>) => {
    const { userId } = useAuth();

    if (!userId) {
        throw new Error("No user id");
    }

    const api = fetcher(userId);

    const toggleReadStatus = (item: T) => {
        const updateRequest = api.SWR(`/item/${item.id}`, "PUT", {
            ...item,
            isRead: !item.isRead,
        });

        const updatedItem = {
            ...item,
            isRead: !item.isRead,
        };

        refetch([updatedItem], updateRequest, () => {
            toast.error("Failed to update item");
        });
    };

    const toggleBookmarkStatus = (item: T) => {
        const updateRequest = api.SWR(`/item/${item.id}`, "PUT", {
            ...item,
            isBookmarked: !item.isBookmarked,
        });

        const updatedItem = {
            ...item,
            isBookmarked: !item.isBookmarked,
        };

        refetch([updatedItem], updateRequest, () => {
            toast.error("Failed to update item");
        });
    };

    const toggleFavoriteStatus = (item: T) => {
        const updateRequest = api.SWR(`/item/${item.id}`, "PUT", {
            ...item,
            isFavorite: !item.isFavorite,
        });

        const updatedItem = {
            ...item,
            isFavorite: !item.isFavorite,
        };

        refetch([updatedItem], updateRequest, () => {
            toast.error("Failed to update item");
        });
    };

    const markMultipleAsRead = (items: T[]) => {
        const updateRequest = api.SWR(`/items/read`, "POST", { ids: items.map(i => i.id) });

        const updatedItems = items
            .filter(i => !i.isRead)
            .map(i => ({
                ...i,
                isRead: true,
            }));

        refetch(updatedItems, updateRequest, () => {
            toast.error("Failed to update items");
        });
    };

    return {
        toggleReadStatus,
        toggleBookmarkStatus,
        toggleFavoriteStatus,
        markMultipleAsRead,
    };
};
