import { fetcher } from "@/lib/fetcher";
import { CleanItem } from "@/models/entities";
import { useAuth } from "@clerk/nextjs";

export const useUpdateItem = <T extends CleanItem>() => {
    const { userId } = useAuth();

    if (!userId) {
        throw new Error("No user id");
    }

    const toggleReadStatus = async (item: T) => {
        return await fetcher(userId).PUT(`/item/${item.id}/read`, {
            markAsRead: !item.isRead,
        });
    };

    return {
        toggleReadStatus,
    };
};
