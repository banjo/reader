import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { toMilliseconds } from "@banjoanton/utils";
import { useQuery } from "@tanstack/react-query";
import { ItemWithContent } from "db";

export const useItemsFetcher = () => {
    const { QUERY: fetcher } = useAuthFetcher();

    const { data, isLoading } = useQuery<ItemWithContent[]>({
        queryKey: ["items"],
        queryFn: async () => await fetcher(`/items`),
        staleTime: toMilliseconds({ hours: 1 }),
        initialData: [],
        initialDataUpdatedAt: 0,
    });

    return { data, isLoading };
};
