"use client";

import { MenuEntries } from "@/client/components/shared/dropdown";
import { Table } from "@/client/components/table/table";
import { FilterBar } from "@/client/components/table/table-filter-bar";
import { TableItem } from "@/client/components/table/table-item";
import { useTableFilters } from "@/client/components/table/use-table-filters";
import { Alert, AlertDescription, AlertTitle } from "@/client/components/ui/alert";
import { CleanFeedWithItems, CleanItem } from "@/shared/models/entities";
import { Refetch } from "@/shared/models/swr";
import { AnimatePresence } from "framer-motion";
import { FC, useMemo } from "react";

export type TitleMenu = {
    title: string;
};

type TableContainerProps = {
    feeds: CleanFeedWithItems[];
    menuOptions?: MenuEntries<CleanItem>[];
    titleMenuOptions?: MenuEntries<TitleMenu>[];
    refetch: Refetch<CleanItem[]>;
    title: string;
};

export type TableCard = CleanItem & {
    feedName: string;
};

export const TableContainer: FC<TableContainerProps> = ({
    feeds,
    menuOptions,
    refetch,
    title,
    titleMenuOptions,
}) => {
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
            <FilterBar
                filters={filters}
                actions={actions}
                title={title}
                titleMenuOptions={titleMenuOptions}
                isSubscribed={!multipleFeeds && feeds[0].isSubscribed}
                feed={feeds[0]}
            />
            <Table type="list">
                <AnimatePresence initial={false}>
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
                        <Alert>
                            <AlertTitle>Ops!</AlertTitle>
                            <AlertDescription>No items found</AlertDescription>
                        </Alert>
                    )}
                </AnimatePresence>
            </Table>
        </>
    );
};
