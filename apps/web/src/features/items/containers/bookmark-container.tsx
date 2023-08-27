import { TableSkeleton } from "@/components/shared/table-skeleton";
import { TableContainerItems } from "@/components/table/table-container-items";
import { useItemsFetcher } from "@/features/items/hooks/use-items-fetcher";
import { useTableItemMenu } from "@/hooks/shared/use-table-item-menu";

export const BookmarkContainer = () => {
    const { data, isLoading, filter, paginate } = useItemsFetcher({ isBookmarked: true });
    const { menuOptionsItems } = useTableItemMenu();

    if (isLoading) return <TableSkeleton />;
    if (!data) return null;

    return (
        <div className="flex flex-col gap-4">
            <TableContainerItems
                items={data}
                menuOptions={menuOptionsItems}
                title="Bookmarks"
                filter={filter}
                paginate={paginate}
            />
        </div>
    );
};
