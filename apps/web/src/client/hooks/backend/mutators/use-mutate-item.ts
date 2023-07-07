import { useAuthFetcher } from "@/client/hooks/backend/use-auth-fetcher";
import { Refetch } from "@/shared/models/swr";
import { ItemWithContent } from "@/shared/models/types";
import { toast } from "react-hot-toast";

type In = {
    refetch: Refetch<ItemWithContent[]>;
};

export const useMutateItem = ({ refetch }: In) => {
    const api = useAuthFetcher();

    const toggleReadStatus = (item: ItemWithContent) => {
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

    const toggleBookmarkStatus = (item: ItemWithContent) => {
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

    const toggleFavoriteStatus = (item: ItemWithContent) => {
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

    const markMultipleAsRead = (items: ItemWithContent[]) => {
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
