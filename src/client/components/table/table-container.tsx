"use client";

import { MenuEntries } from "@/client/components/shared/Dropdown";
import { Table } from "@/client/components/table/table";
import { TableItem } from "@/client/components/table/table-item";
import { Button } from "@/client/components/ui/button";
import { Switch } from "@/client/components/ui/switch";
import { useMutateItem } from "@/client/hooks/backend/mutators/useMutateItem";
import { CleanFeedWithItems, CleanItem } from "@/shared/models/entities";
import { Refetch } from "@/shared/models/swr";
import { AnimatePresence } from "framer-motion";
import { FC, useMemo, useState } from "react";

type TableContainerProps = {
    feeds: CleanFeedWithItems[];
    menuOptions?: MenuEntries<CleanItem>[];
    refetch: Refetch<CleanItem>;
};

type TableCard = CleanItem & {
    feedName: string;
};

type TableFilters = {
    showUnreadOnly: boolean;
    toggleShowUnreadOnly: () => void;
};

type TableActions = {
    markAllAsRead: () => void;
};

type TableFiltersOut = {
    filters: TableFilters;
    data: TableCard[];
    actions: TableActions;
};

const useTableFilters = (data: TableCard[], refetch: Refetch<CleanItem>): TableFiltersOut => {
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
    const toggleShowUnreadOnly = () => {
        setShowUnreadOnly(prev => !prev);
    };

    // ACTIONS
    const markAllAsRead = () => {
        markMultipleAsRead(filteredData);
    };

    return {
        filters: { showUnreadOnly, toggleShowUnreadOnly },
        data: filteredData,
        actions: { markAllAsRead },
    };
};

type FilterBarProps = {
    filters: TableFilters;
    actions: TableActions;
};

export const FilterBar: FC<FilterBarProps> = ({ filters, actions }) => {
    const { showUnreadOnly, toggleShowUnreadOnly } = filters;
    const { markAllAsRead } = actions;

    return (
        <div className="flex h-16 w-full items-center justify-end gap-8 rounded-md bg-slate-100 p-4">
            <Button onClick={markAllAsRead}>Mark all as read</Button>

            <div className="flex items-center">
                <Switch
                    id="show-unread"
                    checked={showUnreadOnly}
                    onCheckedChange={() => toggleShowUnreadOnly()}
                />
                <label htmlFor="show-unread" className="ml-2 text-sm font-medium">
                    Show unread only
                </label>
            </div>
        </div>
    );
};

export const TableContainer: FC<TableContainerProps> = ({ feeds, menuOptions, refetch }) => {
    const multipleFeeds = useMemo(() => feeds.length > 1, [feeds]);

    const formattedData: TableCard[] = useMemo(() => {
        const tableCards: TableCard[] = [];
        for (const feed of feeds) {
            for (const item of feed.items) {
                tableCards.push({ ...item, feedName: feed.name });
            }
        }
        return tableCards;
    }, [feeds]);

    const { data, filters, actions } = useTableFilters(formattedData, refetch);

    return (
        <>
            <FilterBar filters={filters} actions={actions} />
            <Table type="list">
                <AnimatePresence initial={false}>
                    {data.map(item => {
                        return (
                            <TableItem
                                key={item.id}
                                item={item}
                                type="list"
                                feedName={item.feedName}
                                showFeedName={multipleFeeds}
                                menuOptions={menuOptions}
                                refetch={refetch}
                            />
                        );
                    })}
                </AnimatePresence>
            </Table>
        </>
    );
};
