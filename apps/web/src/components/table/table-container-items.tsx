import { MenuEntries } from "@/components/shared/dropdown";
import { Table } from "@/components/table/table";
import { TitleMenu } from "@/components/table/table-container-content";
import { FilterBar } from "@/components/table/table-filter-bar";
import { TableItem } from "@/components/table/table-item";
import { useTableFiltersItems } from "@/components/table/use-table-filters-items";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMutateItem } from "@/hooks/backend/mutators/use-mutate-item";
import { Filter } from "@/hooks/shared/use-filters";
import { Paginate } from "@/hooks/shared/use-pagination";
import { CleanFeedWithItems, ItemWithContent } from "db";
import { FC } from "react";

type TableContainerProps = {
    items: ItemWithContent[];
    feed?: CleanFeedWithItems;
    menuOptions?: MenuEntries<ItemWithContent>[];
    titleMenuOptions?: MenuEntries<TitleMenu>[];
    title: string;
    paginate?: Paginate;
    filter?: Filter;
};

export const TableContainerItems: FC<TableContainerProps> = ({
    items,
    menuOptions,
    title,
    titleMenuOptions,
    feed,
    paginate,
    filter,
}) => {
    const { filters, actions } = useTableFiltersItems(items, filter);
    const { toggleReadStatus } = useMutateItem();

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
                paginate={paginate}
            />
            <Table type={filters.currentTableType}>
                {items.length > 0 &&
                    items.map(item => {
                        return (
                            <TableItem
                                key={item.id}
                                item={item}
                                type={filters.currentTableType}
                                feedName={feed?.name}
                                showFeedName={false}
                                menuOptions={menuOptions}
                                isSubscribed={feed?.isSubscribed ?? true}
                                onClick={() => onClick(item)}
                            />
                        );
                    })}

                {items.length === 0 && (
                    <Alert>
                        <AlertTitle>Ops!</AlertTitle>
                        <AlertDescription>No items found</AlertDescription>
                    </Alert>
                )}
            </Table>
        </>
    );
};
