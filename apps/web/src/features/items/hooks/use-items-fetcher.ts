import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useUpdateSidebar } from "@/hooks/backend/use-update-sidebar";
import { Refetch } from "@/models/swr";
import { ItemWithContent } from "db";
import { useMemo } from "react";
import useSWR from "swr";

type Out = {
    data: ItemWithContent[];
    isLoading: boolean;
    refetch: Refetch<ItemWithContent[]>;
};

type In = {
    key: string;
};

export const useItemsFetcher = ({ key }: In): Out => {
    const { SWR_AUTH: fetcher } = useAuthFetcher();
    const { fetchLatestInSidebar, mutateSidebarItems } = useUpdateSidebar();

    const { data: fetchData, mutate } = useSWR<ItemWithContent[], Error>(key, fetcher, {});

    const data = useMemo(() => {
        return fetchData ?? [];
    }, [fetchData]);

    const refetch: Refetch<ItemWithContent[]> = async (updatedItems, updateFn, onError) => {
        const allItems = data.map(i => {
            const updatedItem = updatedItems.find(ui => ui.id === i.id);

            if (updatedItem) {
                return updatedItem;
            }

            return i;
        });

        mutate(allItems, false);
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
