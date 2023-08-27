import { TableType } from "@/components/table/table.types";
import { useTableTypeStore } from "@/components/table/use-table-type-store";
import { useMutateItem } from "@/hooks/backend/mutators/use-mutate-item";
import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useInvalidate } from "@/hooks/backend/use-invalidate";
import { Filter } from "@/hooks/shared/use-filters";
import { ItemWithContent } from "db";
import { useMemo } from "react";
import toast from "react-hot-toast";

export type TableFiltersItems = {
    toggleShowUnreadOnly: () => void;
    showUnreadOnly: boolean;
    currentTableType: TableType;
    hasReadAll: boolean;
};

export type TableActionsItems = {
    markAllAsRead: () => void;
    subscribe: (internalIdentifier: string) => Promise<void>;
    refresh: () => Promise<void>;
    selectTableType: (tableType: TableType) => void;
};

type TableFiltersOut = {
    filters: TableFiltersItems;
    actions: TableActionsItems;
};

export const useTableFiltersItems = (data: ItemWithContent[], filter?: Filter): TableFiltersOut => {
    const { markMultipleAsRead } = useMutateItem();
    const { refetch, invalidate } = useInvalidate();
    const api = useAuthFetcher();
    const { setCurrent, current } = useTableTypeStore();

    // FILTERS
    const hasReadAll = useMemo(() => {
        return data.every(item => item.isRead === true);
    }, [data]);

    const showUnreadOnly = useMemo(() => {
        if (!filter) {
            return false;
        }

        return filter.isRead() === false;
    }, [filter?.isRead()]);

    const currentTableType = useMemo(() => current, [current]);

    const toggleShowUnreadOnly = () => {
        if (!filter) {
            return;
        }

        if (filter.isRead()) {
            toast.success("Showing unread items");
        } else {
            toast.success("Showing all items");
        }

        filter.toggleIsRead();
    };

    // ACTIONS
    const markAllAsRead = () => {
        markMultipleAsRead(data);
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
        filters: { toggleShowUnreadOnly, currentTableType, showUnreadOnly, hasReadAll },
        actions: { markAllAsRead, subscribe, refresh, selectTableType },
    };
};
