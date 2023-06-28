"use client";

import { MenuEntries } from "@/client/components/shared/dropdown";
import { Table } from "@/client/components/table/table";
import { FilterBar } from "@/client/components/table/table-filter-bar";
import { TableItem } from "@/client/components/table/table-item";
import { useTableFilters } from "@/client/components/table/use-table-filters";
import { Alert, AlertDescription, AlertTitle } from "@/client/components/ui/alert";
import { CleanFeed, CleanItem } from "@/shared/models/entities";
import { Refetch } from "@/shared/models/swr";
import { isDefined } from "@banjoanton/utils";
import { AnimatePresence } from "framer-motion";
import { FC } from "react";

export type TitleMenu = {
    title: string;
};

type TableContainerProps = {
    items: CleanItem[];
    feed?: CleanFeed;
    menuOptions?: MenuEntries<CleanItem>[];
    titleMenuOptions?: MenuEntries<TitleMenu>[];
    refetch: Refetch<CleanItem[]>;
    title: string;
};

export const TableContainer: FC<TableContainerProps> = ({
    items,
    menuOptions,
    refetch,
    title,
    titleMenuOptions,
    feed,
}) => {
    const { data, filters, actions } = useTableFilters(items, refetch);

    return (
        <>
            <FilterBar
                filters={filters}
                actions={actions}
                title={title}
                titleMenuOptions={titleMenuOptions}
                isSubscribed={feed?.isSubscribed ?? true}
                feed={feed}
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
                                    showFeedName={!isDefined(feed)}
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
