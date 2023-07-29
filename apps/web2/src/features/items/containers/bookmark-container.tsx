"use client";

import { TableContainerItems } from "@/components/table/table-container-items";
import { useItemsFetcher } from "@/features/items/hooks/use-items-fetcher";
import { useTableItemMenu } from "@/hooks/shared/use-table-item-menu";
import { noop } from "@banjoanton/utils";
import { useMemo } from "react";

export const BookmarkContainer = () => {
    const { data, refetch } = useItemsFetcher({
        key: "/items",
    });
    const { menuOptionsItems } = useTableItemMenu({
        refetchItemsMultiple: refetch,
        refetchContentMultiple: noop,
    });

    const filtered = useMemo(() => data.filter(item => item.isBookmarked), [data]);

    return (
        <div className="flex flex-col gap-4">
            <TableContainerItems
                items={filtered}
                menuOptions={menuOptionsItems}
                refetch={refetch}
                title="Bookmarks"
            />
        </div>
    );
};
