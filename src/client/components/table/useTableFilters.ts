import { TableCard } from "@/client/components/table/table-container";
import { useMutateItem } from "@/client/hooks/backend/mutators/useMutateItem";
import { CleanItem } from "@/shared/models/entities";
import { Refetch } from "@/shared/models/swr";
import { useMemo, useState } from "react";

export type TableFilters = {
    showUnreadOnly: boolean;
    hasReadAll: boolean;
    toggleShowUnreadOnly: () => void;
};

export type TableActions = {
    markAllAsRead: () => void;
};

type TableFiltersOut = {
    filters: TableFilters;
    data: TableCard[];
    actions: TableActions;
};

export const useTableFilters = (
    data: TableCard[],
    refetch: Refetch<CleanItem[]>
): TableFiltersOut => {
    const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(() => {
        return data.some(item => item.isRead === false);
    });
    const { markMultipleAsRead } = useMutateItem({ refetch });

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

    return {
        filters: { showUnreadOnly, toggleShowUnreadOnly, hasReadAll },
        data: filteredData,
        actions: { markAllAsRead },
    };
};
