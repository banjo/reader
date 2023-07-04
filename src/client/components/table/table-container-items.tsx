"use client";

import { MenuEntries } from "@/client/components/shared/dropdown";
import { Table } from "@/client/components/table/table";
import { FilterBar } from "@/client/components/table/table-filter-bar";
import { TableItem } from "@/client/components/table/table-item";
import { useTableFiltersItems } from "@/client/components/table/use-table-filters-items";
import { Alert, AlertDescription, AlertTitle } from "@/client/components/ui/alert";
import { Refetch } from "@/shared/models/swr";
import { CleanFeedWithItems, ItemWithContent } from "@/shared/models/types";
import { AnimatePresence } from "framer-motion";
import { FC } from "react";

export type TitleMenu = {
    title: string;
};

type TableContainerProps = {
    items: ItemWithContent[];
    feed?: CleanFeedWithItems;
    menuOptions?: MenuEntries<ItemWithContent>[];
    titleMenuOptions?: MenuEntries<TitleMenu>[];
    refetch: Refetch<ItemWithContent[]>;
    title: string;
};

export const TableContainerItems: FC<TableContainerProps> = ({
    items,
    menuOptions,
    refetch,
    title,
    titleMenuOptions,
    feed,
}) => {
    const { data, filters, actions } = useTableFiltersItems(items, refetch);

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
                                    feedName={feed?.name}
                                    showFeedName={false}
                                    menuOptions={menuOptions}
                                    refetch={refetch}
                                    isSubscribed={feed?.isSubscribed ?? true}
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
