import { TableType } from "@/components/table/table.types";
import { useTableTypeStore } from "@/components/table/use-table-type-store";
import { useMutateItem } from "@/hooks/backend/mutators/use-mutate-item";
import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useInvalidate } from "@/hooks/backend/use-invalidate";
import { ItemWithContent } from "db";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

export type TableFiltersItems = {
    showUnreadOnly: boolean;
    hasReadAll: boolean;
    toggleShowUnreadOnly: () => void;
    currentTableType: TableType;
};

export type TableActionsItems = {
    markAllAsRead: () => void;
    subscribe: (internalIdentifier: string) => Promise<void>;
    refresh: () => Promise<void>;
    selectTableType: (tableType: TableType) => void;
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
    const { refetch, invalidate } = useInvalidate();
    const api = useAuthFetcher();
    const { setCurrent, current } = useTableTypeStore();

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

    const currentTableType = useMemo(() => current, [current]);

    const toggleShowUnreadOnly = () => {
        setShowUnreadOnly(prev => !prev);
        if (showUnreadOnly) {
            toast.success("Showing all items");
        } else {
            toast.success("Showing unread items");
        }
    };

    // ACTIONS
    const markAllAsRead = () => {
        markMultipleAsRead(filteredData);
        toast.success("Marked all as read");
    };

    const subscribe = async (internalIdentifier: string) => {
        const subscribeResult = await api.POST(`/feed/${internalIdentifier}/subscribe`, {});

        if (!subscribeResult.success) {
            toast.error("Failed to subscribe to feed");
            return;
        }

        invalidate();
    };

    const refresh = async () => {
        await invalidate();
        toast.success("Feed refreshed");
    };

    const selectTableType = async (tableType: TableType) => {
        setCurrent(tableType);
    };

    return {
        filters: { showUnreadOnly, toggleShowUnreadOnly, hasReadAll, currentTableType },
        data: filteredData,
        actions: { markAllAsRead, subscribe, refresh, selectTableType },
    };
};
