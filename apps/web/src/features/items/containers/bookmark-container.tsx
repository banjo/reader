"use client";

import { TableSkeleton } from "@/components/shared/table-skeleton";
import { TableContainerItems } from "@/components/table/table-container-items";
import { useItemsFetcher } from "@/features/items/hooks/use-items-fetcher";
import { useTableItemMenu } from "@/hooks/shared/use-table-item-menu";
import { useMemo } from "react";

export const BookmarkContainer = () => {
    const { data, isLoading } = useItemsFetcher();
    const { menuOptionsItems } = useTableItemMenu();
    const filtered = useMemo(() => data.filter(item => item.isBookmarked), [data]);

    if (isLoading) return <TableSkeleton />;
    if (!data) return null;

    return (
        <div className="flex flex-col gap-4">
            <TableContainerItems
                items={filtered}
                menuOptions={menuOptionsItems}
                title="Bookmarks"
            />
        </div>
    );
};
