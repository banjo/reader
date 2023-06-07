import { useAuthFetcher } from "@/client/hooks/backend/useAuthFetcher";
import { useUpdateSidebar } from "@/client/hooks/backend/useUpdateSidebar";
import { CleanFeedWithItems, CleanItem } from "@/shared/models/entities";
import { Refetch } from "@/shared/models/swr";
import { useMemo } from "react";
import useSWR from "swr";

type Out = {
    data: CleanFeedWithItems;
    isLoading: boolean;
    refetch: Refetch<CleanItem>;
};

type In = {
    key: string;
    fallbackData: CleanFeedWithItems;
};

export const useFeedFetcher = ({ key, fallbackData }: In): Out => {
    const fetcher = useAuthFetcher();
    const { fetchLatestInSidebar, mutateSidebarItem } = useUpdateSidebar();

    const { data: fetchData, mutate } = useSWR<CleanFeedWithItems, Error>(key, fetcher, {
        fallbackData: fallbackData,
    });

    const data = useMemo(() => {
        return fetchData ?? fallbackData;
    }, [fallbackData, fetchData]);

    const refetch: Refetch<CleanItem> = async (
        updatedItem: CleanItem,
        updateFn: () => Promise<undefined>,
        onError?: () => void
    ) => {
        const updatedFeed = data.items.map(i => {
            if (i.id === updatedItem.id) {
                return updatedItem;
            }
            return i;
        });

        const updatedData = {
            ...data,
            items: updatedFeed,
        };

        mutate(updatedData, false);
        mutateSidebarItem(updatedItem);

        try {
            await updateFn();
        } catch (error) {
            console.error(error);
            if (onError) onError();
        }

        mutate();
        fetchLatestInSidebar();
    };

    return {
        data: data,
        isLoading: !data,
        refetch: refetch,
    };
};
