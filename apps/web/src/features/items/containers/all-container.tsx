import { TableSkeleton } from "@/components/shared/table-skeleton";
import { TableContainerItems } from "@/components/table/table-container-items";
import { useItemsFetcher } from "@/features/items/hooks/use-items-fetcher";
import { useTableItemMenu } from "@/hooks/shared/use-table-item-menu";

export const AllContainer = () => {
    const { data, isLoading, paginate, filter } = useItemsFetcher();
    const { menuOptionsItems } = useTableItemMenu();

    if (isLoading) return <TableSkeleton />;
    if (!data) return null;

    return (
        <div className="flex flex-col gap-4">
            <TableContainerItems
                items={data.data}
                menuOptions={menuOptionsItems}
                title="All"
                paginate={paginate}
                filter={filter}
            />
        </div>
    );
};
