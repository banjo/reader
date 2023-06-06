import { fetcher } from "@/lib/fetcher";
import { CleanItem } from "@/models/entities";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";

export const useUpdateItem = <T extends CleanItem>() => {
    const { userId } = useAuth();

    if (!userId) {
        throw new Error("No user id");
    }

    const api = fetcher(userId);

    const toggleReadStatus = async (item: T) => {
        const res = await api.PUT(`/item/${item.id}/read`, {
            markAsRead: !item.isRead,
        });

        if (!res.success) {
            toast.error(res.message);
            return;
        }

        toast.success("Item updated");
    };

    return {
        toggleReadStatus,
    };
};
