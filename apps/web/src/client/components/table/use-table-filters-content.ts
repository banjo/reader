import { useAuthFetcher } from "@/client/hooks/backend/use-auth-fetcher";
import { useUpdateSidebar } from "@/client/hooks/backend/use-update-sidebar";
import { ItemContent } from "db";
import toast from "react-hot-toast";
import { useSWRConfig } from "swr";

export type TableFiltersContent = object;

export type TableActionsContent = {
    subscribe: (internalIdentifier: string) => Promise<void>;
};

type TableFiltersOut = {
    filters: TableFiltersContent;
    data: ItemContent[];
    actions: TableActionsContent;
};

export const useTableFiltersContent = (data: ItemContent[]): TableFiltersOut => {
    const { fetchLatestInSidebar } = useUpdateSidebar();
    const { mutate } = useSWRConfig();
    const api = useAuthFetcher();

    // ACTIONS
    const subscribe = async (internalIdentifier: string) => {
        const subscribeResult = await api.POST(`/feed/${internalIdentifier}/subscribe`, {});

        if (!subscribeResult.success) {
            toast.error("Failed to subscribe to feed");
            return;
        }

        mutate(`/feed/${internalIdentifier}`);
        fetchLatestInSidebar();
    };

    return {
        filters: {},
        data: data,
        actions: { subscribe },
    };
};
