"use client";

import { MenuEntries } from "@/client/components/shared/dropdown";
import { Table } from "@/client/components/table/table";
import { TableItem } from "@/client/components/table/table-item";
import { Alert, AlertDescription, AlertTitle } from "@/client/components/ui/alert";
import { Button } from "@/client/components/ui/button";
import { Switch } from "@/client/components/ui/switch";
import { useMutateItem } from "@/client/hooks/backend/mutators/useMutateItem";
import { CleanFeedWithItems, CleanItem } from "@/shared/models/entities";
import { Refetch } from "@/shared/models/swr";
import { AnimatePresence } from "framer-motion";
import { FC, useEffect, useMemo, useState } from "react";

type TableContainerProps = {
    feeds: CleanFeedWithItems[];
    menuOptions?: MenuEntries<CleanItem>[];
    refetch: Refetch<CleanItem[]>;
    title: string;
};

type TableCard = CleanItem & {
    feedName: string;
};

type TableFilters = {
    showUnreadOnly: boolean;
    hasReadAll: boolean;
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

const useTableFilters = (data: TableCard[], refetch: Refetch<CleanItem[]>): TableFiltersOut => {
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

    useEffect(() => {
        if (hasReadAll) {
            setTimeout(() => {
                setShowUnreadOnly(false);
            }, 200);
        }
    }, [hasReadAll]);

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

type FilterBarProps = {
    filters: TableFilters;
    actions: TableActions;
    title: string;
};

export const FilterBar: FC<FilterBarProps> = ({ filters, actions, title }) => {
    const { showUnreadOnly, toggleShowUnreadOnly, hasReadAll } = filters;
    const { markAllAsRead } = actions;

    return (
        <div className="flex h-32 w-full items-center justify-end gap-8 rounded-md border border-border p-4">
            <span className="mr-auto text-lg font-medium">{title}</span>

            <Button onClick={markAllAsRead} disabled={hasReadAll}>
                Mark all as read
            </Button>

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

export const TableContainer: FC<TableContainerProps> = ({ feeds, menuOptions, refetch, title }) => {
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
            <FilterBar filters={filters} actions={actions} title={title} />
            <Table type="list">
                <AnimatePresence mode={"wait"} initial={false}>
                    {data.length > 0 &&
                        data.map(item => {
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

                    {data.length === 0 && (
                        <Alert className="">
                            <AlertTitle>Ops!</AlertTitle>
                            <AlertDescription>No items found</AlertDescription>
                        </Alert>
                    )}
                </AnimatePresence>
            </Table>
        </>
    );
};
