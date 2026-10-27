import { MenuEntries } from "@/components/shared/dropdown";
import { Table } from "@/components/table/table";
import { FilterBar } from "@/components/table/table-filter-bar";
import { TableItem } from "@/components/table/table-item";
import { useTableFiltersContent } from "@/components/table/use-table-filters-content";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Filter } from "@/hooks/shared/use-filters";
import { Paginate } from "@/hooks/shared/use-pagination";
import { noop } from "@banjoanton/utils";
import { CleanFeedWithContent, ItemContent } from "db";
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
    paginate?: Paginate;
    filter?: Filter;
};

export const TableContainerContent: FC<TableContainerProps> = ({
    content,
    menuOptions,
    title,
    titleMenuOptions,
    feed,
    paginate,
    filter,
}) => {
    const { filters, actions, data } = useTableFiltersContent(content, filter, paginate);

    return (
        <>
            <FilterBar
                filters={filters}
                actions={actions}
                title={title}
                titleMenuOptions={titleMenuOptions}
                isSubscribed={false}
                feed={feed}
                paginate={paginate}
            />
            <Table type="list">
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
                        <AlertDescription>
                            {filters.search ? "No articles match your search" : "No content found"}
                        </AlertDescription>
                    </Alert>
                )}
            </Table>
        </>
    );
};
