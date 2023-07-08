"use client";

import { FC } from "react";
import { MenuEntries } from "@/client/components/shared/dropdown";
import { Table } from "@/client/components/table/table";
import { FilterBar } from "@/client/components/table/table-filter-bar";
import { TableItem } from "@/client/components/table/table-item";
import { useTableFiltersItems } from "@/client/components/table/use-table-filters-items";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/client/components/ui/alert";
import { useMutateItem } from "@/client/hooks/backend/mutators/use-mutate-item";
import { Refetch } from "@/shared/models/swr";
import { CleanFeedWithItems, ItemWithContent } from "db";
import { AnimatePresence } from "framer-motion";

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
    const { toggleReadStatus } = useMutateItem({ refetch });

    const onClick = (item: ItemWithContent) => {
        toggleReadStatus(item);
        window.open(item.content.link, "_blank");
    };

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
                        data.map((item) => {
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
                                    onClick={() => onClick(item)}
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
