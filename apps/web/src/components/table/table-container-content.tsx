import { MenuEntries } from "@/components/shared/dropdown";
import { Table } from "@/components/table/table";
import { FilterBar } from "@/components/table/table-filter-bar";
import { TableItem } from "@/components/table/table-item";
import { useTableFiltersContent } from "@/components/table/use-table-filters-content";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { noop } from "@banjoanton/utils";
import { CleanFeedWithContent, ItemContent } from "db";
import { AnimatePresence } from "framer-motion";
import { FC } from "react";

export type TitleMenu = {
    title: string;
};

type TableContainerProps = {
    content: ItemContent[];
    feed?: CleanFeedWithContent;
    menuOptions?: MenuEntries<ItemContent>[];
    titleMenuOptions?: MenuEntries<TitleMenu>[];
    title: string;
};

export const TableContainerContent: FC<TableContainerProps> = ({
    content,
    menuOptions,
    title,
    titleMenuOptions,
    feed,
}) => {
    const { filters, actions, data } = useTableFiltersContent(content);

    return (
        <>
            <FilterBar
                filters={filters}
                actions={actions}
                title={title}
                titleMenuOptions={titleMenuOptions}
                isSubscribed={false}
                feed={feed}
            />
            <Table type="list">
                <AnimatePresence initial={false}>
                    {data.length > 0 &&
                        data.map(c => {
                            return (
                                <TableItem
                                    key={c.id}
                                    item={c}
                                    type="list"
                                    showFeedName={false}
                                    menuOptions={menuOptions}
                                    isSubscribed={false}
                                    onClick={noop}
                                />
                            );
                        })}

                    {data.length === 0 && (
                        <Alert>
                            <AlertTitle>Ops!</AlertTitle>
                            <AlertDescription>No content found</AlertDescription>
                        </Alert>
                    )}
                </AnimatePresence>
            </Table>
        </>
    );
};
