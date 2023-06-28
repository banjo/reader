import { useAuthFetcher } from "@/client/hooks/backend/use-auth-fetcher";
import { useUpdateSidebar } from "@/client/hooks/backend/use-update-sidebar";
import { CleanItem } from "@/shared/models/entities";
import { Refetch } from "@/shared/models/swr";
import { useMemo } from "react";
import useSWR from "swr";

type Out = {
    data: CleanItem[];
    isLoading: boolean;
    refetch: Refetch<CleanItem[]>;
};

type In = {
    key: string;
    fallbackData: CleanItem[];
};

export const useItemsFetcher = ({ key, fallbackData }: In): Out => {
    const { SWR_AUTH: fetcher } = useAuthFetcher();
    const { fetchLatestInSidebar, mutateSidebarItems } = useUpdateSidebar();

    const { data: fetchData, mutate } = useSWR<CleanItem[], Error>(key, fetcher, {
        fallbackData: fallbackData,
    });

    const data = useMemo(() => {
        return fetchData ?? fallbackData;
    }, [fallbackData, fetchData]);

    const refetch: Refetch<CleanItem[]> = async (updatedItems, updateFn, onError) => {
        const updatedFeed = data.map(i => {
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
    };
};
