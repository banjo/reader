import { fetcher } from "@/lib/fetcher";

export const markItemAsRead = async (id: number) => {
    const res = await fetcher.PUT(`/api/items/${id}/read`, {});
    return res;
};
