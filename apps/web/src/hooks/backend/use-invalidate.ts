import { feedsQueryKey, itemCountsQueryKey } from "@/hooks/backend/query-keys";
import { useQueryClient } from "@tanstack/react-query";

export const useInvalidate = () => {
    const queryClient = useQueryClient();

    const invalidateFeeds = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: feedsQueryKey }),
            queryClient.invalidateQueries({ queryKey: itemCountsQueryKey }),
        ]);
    };

    const invalidate = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["items"] }),
            invalidateFeeds(),
        ]);
    };

    const cancelQueries = async () => {
        await queryClient.cancelQueries({ queryKey: ["items"] });
    };

    const refetch = async () => {
        await queryClient.refetchQueries({ queryKey: ["items"] });
    };

    const clear = () => {
        queryClient.removeQueries();
    };

    return {
        invalidate,
        invalidateFeeds,
        cancelQueries,
        refetch,
        clear,
        queryClient,
    };
};
