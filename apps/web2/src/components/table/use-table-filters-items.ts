import { useMutateItem } from "@/hooks/backend/mutators/use-mutate-item";
import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useUpdateSidebar } from "@/hooks/backend/use-update-sidebar";
import { Refetch } from "@/models/swr";
import { ItemWithContent } from "db";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSWRConfig } from "swr";

export type TableFiltersItems = {
    showUnreadOnly: boolean;
    hasReadAll: boolean;
    toggleShowUnreadOnly: () => void;
};

export type TableActionsItems = {
    markAllAsRead: () => void;
    subscribe: (internalIdentifier: string) => Promise<void>;
};

type TableFiltersOut = {
    filters: TableFiltersItems;
    data: ItemWithContent[];
    actions: TableActionsItems;
};

export const useTableFiltersItems = (
    data: ItemWithContent[],
    refetch: Refetch<ItemWithContent[]>
): TableFiltersOut => {
    const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(() => {
        return data.some(item => item.isRead === false);
    });
    const { markMultipleAsRead } = useMutateItem({ refetch });
    const { fetchLatestInSidebar } = useUpdateSidebar();
    const { mutate } = useSWRConfig();
    const api = useAuthFetcher();

    // FILTERED DATA
    const filteredData = useMemo(() => {
        if (showUnreadOnly) {
            return data.filter(item => item.isRead === false);
        }
        return data;
    }, [data, showUnreadOnly]);

    // FILTERS
    const hasReadAll = useMemo(() => {
        return filteredData.every(item => item.isRead === true);
    }, [filteredData]);

    const toggleShowUnreadOnly = () => {
        setShowUnreadOnly(prev => !prev);
    };

    // ACTIONS
    const markAllAsRead = () => {
        markMultipleAsRead(filteredData);
    };

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
        filters: { showUnreadOnly, toggleShowUnreadOnly, hasReadAll },
        data: filteredData,
        actions: { markAllAsRead, subscribe },
    };
};
