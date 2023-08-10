import { useMutateItem } from "@/hooks/backend/mutators/use-mutate-item";
import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useQueryClient } from "@tanstack/react-query";
import { ItemWithContent } from "db";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

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

export const useTableFiltersItems = (data: ItemWithContent[]): TableFiltersOut => {
    const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(() => {
        return data.some(item => item.isRead === false);
    });
    const { markMultipleAsRead } = useMutateItem();
    const queryClient = useQueryClient();
    // const { fetchLatestInSidebar } = useUpdateSidebar();
    // const { mutate } = useSWRConfig();
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

        queryClient.invalidateQueries({ queryKey: ["feed", internalIdentifier] });
        // mutate(`/feed/${internalIdentifier}`);
        // fetchLatestInSidebar();
    };

    return {
        filters: { showUnreadOnly, toggleShowUnreadOnly, hasReadAll },
        data: filteredData,
        actions: { markAllAsRead, subscribe },
    };
};
