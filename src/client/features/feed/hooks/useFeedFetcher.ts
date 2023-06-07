import { useAuthFetcher } from "@/client/hooks/backend/useAuthFetcher";
import { useUpdateSidebar } from "@/client/hooks/backend/useUpdateSidebar";
import { CleanFeedWithItems, CleanItem } from "@/shared/models/entities";
import { Refetch } from "@/shared/models/swr";
import { toArray } from "@banjoanton/utils";
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
    const { fetchLatestInSidebar, mutateSidebarItems } = useUpdateSidebar();

    const { data: fetchData, mutate } = useSWR<CleanFeedWithItems, Error>(key, fetcher, {
        fallbackData: fallbackData,
    });

    const data = useMemo(() => {
        return fetchData ?? fallbackData;
    }, [fallbackData, fetchData]);

    const refetch: Refetch<CleanItem> = async (updated, updateFn, onError) => {
        const updatedItems = toArray(updated);

        const updatedFeed = data.items.map(i => {
            const updatedItem = updatedItems.find(ui => ui.id === i.id);

            if (updatedItem) {
                return updatedItem;
            }

            return i;
        });

        const updatedData = {
            ...data,
            items: updatedFeed,
        };

        mutate(updatedData, false);
        mutateSidebarItems(updatedItems);

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
