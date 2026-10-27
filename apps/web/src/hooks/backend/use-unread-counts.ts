import { itemCountsQueryKey } from "@/hooks/backend/query-keys";
import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useQuery } from "@tanstack/react-query";
import type { ItemUnreadCounts } from "model";

const emptyCounts: ItemUnreadCounts = {
    totalUnread: 0,
    bookmarksUnread: 0,
    favoritesUnread: 0,
};

export const useUnreadCounts = () => {
    const api = useAuthFetcher();
    const { data = emptyCounts } = useQuery({
        queryKey: itemCountsQueryKey,
        queryFn: () => api.QUERY<ItemUnreadCounts>("/items/counts"),
        staleTime: 60_000,
    });
    return data;
};
