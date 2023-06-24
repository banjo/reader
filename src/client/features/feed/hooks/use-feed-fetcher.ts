import { useAuthFetcher } from "@/client/hooks/backend/use-auth-fetcher";
import { useUpdateSidebar } from "@/client/hooks/backend/use-update-sidebar";
import { CleanFeedWithItems, CleanItem } from "@/shared/models/entities";
import { Refetch } from "@/shared/models/swr";
import { useMemo } from "react";
import useSWR from "swr";

type Out = {
    data: CleanFeedWithItems;
    isLoading: boolean;
    refetch: Refetch<CleanItem>;
    refetchMultiple: Refetch<CleanItem[]>;
    refetchFeed: Refetch<CleanFeedWithItems>;
    unsubscribe: (updateFn: () => Promise<undefined>, onError: () => void) => Promise<void>;
};

type In = {
    key: string;
    fallbackData: CleanFeedWithItems;
};

export type UnsubscribeFn = (
    updateFn: () => Promise<undefined>,
    onError: () => void
) => Promise<void>;

export const useFeedFetcher = ({ key, fallbackData }: In): Out => {
    const { SWR_AUTH: fetcher } = useAuthFetcher();
    const { fetchLatestInSidebar, mutateSidebarItem, mutateSidebarItems } = useUpdateSidebar();

    const { data: fetchData, mutate } = useSWR<CleanFeedWithItems, Error>(key, fetcher, {
        fallbackData: fallbackData,
    });

    const data = useMemo(() => {
        return fetchData ?? fallbackData;
    }, [fallbackData, fetchData]);

    const unsubscribe: UnsubscribeFn = async (updateFn, onError) => {
        mutate(undefined, false);
        mutateSidebarItems([]);

        try {
            await updateFn();
        } catch (error) {
            console.error(error);
            if (onError) onError();
        }

        mutate();
        fetchLatestInSidebar();
    };

    const refetchFeed: Refetch<CleanFeedWithItems> = async (updatedFeed, updateFn, onError) => {
        const updatedData = {
            ...data,
            ...updatedFeed,
        };

        mutate(updatedData, false);
        mutateSidebarItems(updatedFeed.items);

        try {
            await updateFn();
        } catch (error) {
            console.error(error);
            if (onError) onError();
        }

        mutate();
        fetchLatestInSidebar();
    };

    const refetch: Refetch<CleanItem> = async (updatedItem, updateFn, onError) => {
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

    const refetchMultiple: Refetch<CleanItem[]> = async (updatedItems, updateFn, onError) => {
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
        data,
        isLoading: !data,
        refetch,
        refetchMultiple: refetchMultiple,
        refetchFeed,
        unsubscribe,
    };
};
