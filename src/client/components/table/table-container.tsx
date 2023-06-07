"use client";

import { MenuEntries } from "@/client/components/shared/Dropdown";
import { Table } from "@/client/components/table/table";
import { TableItem } from "@/client/components/table/table-item";
import { Switch } from "@/client/components/ui/switch";
import { CleanFeedWithItems, CleanItem } from "@/shared/models/entities";
import { Refetch } from "@/shared/models/swr";
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

type TableFiltersOut = {
    filters: TableFilters;
    data: TableCard[];
};

const useTableFilters = (data: TableCard[]): TableFiltersOut => {
    const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(true);

    const filteredData = useMemo(() => {
        if (showUnreadOnly) {
            return data.filter(item => item.isRead === false);
        }
        return data;
    }, [data, showUnreadOnly]);

    const toggleShowUnreadOnly = () => {
        setShowUnreadOnly(prev => !prev);
    };

    return { filters: { showUnreadOnly, toggleShowUnreadOnly }, data: filteredData };
};

type FilterBarProps = {
    filters: TableFilters;
};

export const FilterBar: FC<FilterBarProps> = ({ filters }) => {
    const { showUnreadOnly, toggleShowUnreadOnly } = filters;
    return (
        <div className="flex h-16 w-full items-center justify-end rounded-md bg-slate-100 p-4">
            <div className="flex items-center">
                <Switch
                    id="show-unread"
                    checked={showUnreadOnly}
                    onCheckedChange={() => toggleShowUnreadOnly()}
                />
                <label htmlFor="show-unread" className="ml-2 text-sm font-medium">
                    Unread
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

    const { data, filters } = useTableFilters(formattedData);

    return (
        <>
            <FilterBar filters={filters} />
            <Table type="list">
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
            </Table>
        </>
    );
};
