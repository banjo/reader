import { fetcher } from "@/lib/fetcher";
import { CleanItem } from "@/models/entities";
import { Refetch } from "@/models/swr";
import { useAuth } from "@clerk/nextjs";

type In<T> = {
    refetch: Refetch<T>;
};

export const useMutateItem = <T extends CleanItem>({ refetch }: In<T>) => {
    const { userId } = useAuth();

    if (!userId) {
        throw new Error("No user id");
    }

    const api = fetcher(userId);

    const toggleReadStatus = (item: T) => {
        const updateRequest = api.SWR(`/item/${item.id}/read`, "PUT", {
            markAsRead: !item.isRead,
        });

        const updatedItem = {
            ...item,
            isRead: !item.isRead,
        };

        refetch(updatedItem, updateRequest);
    };

    return {
        toggleReadStatus,
    };
};
