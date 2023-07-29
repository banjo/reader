import { TableContainerItems } from "@/components/table/table-container-items";
import { useItemsFetcher } from "@/features/items/hooks/use-items-fetcher";
import { useTableItemMenu } from "@/hooks/shared/use-table-item-menu";
import { noop } from "@banjoanton/utils";

export const AllContainer = () => {
    const { data, refetch } = useItemsFetcher({
        key: "/items",
    });
    const { menuOptionsItems } = useTableItemMenu({
        refetchItemsMultiple: refetch,
        refetchContentMultiple: noop,
    });

    return (
        <div className="flex flex-col gap-4">
            <TableContainerItems
                items={data}
                menuOptions={menuOptionsItems}
                refetch={refetch}
                title={"All"}
            />
        </div>
    );
};
