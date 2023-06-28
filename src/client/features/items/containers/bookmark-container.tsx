"use client";

import { TableContainer } from "@/client/components/table/table-container";
import { useItemsFetcher } from "@/client/features/items/hooks/use-items-fetcher";
import { useTableItemMenu } from "@/client/hooks/shared/use-table-item-menu";
import { CleanItem } from "@/shared/models/entities";
import { FC, useMemo } from "react";

type Props = {
    items: CleanItem[];
};

export const BookmarkContainer: FC<Props> = ({ items }) => {
    const { data, refetch } = useItemsFetcher({ key: "/items", fallbackData: items });
    const { menuOptions } = useTableItemMenu({ refetch });

    const filtered = useMemo(() => data.filter(item => item.isFavorite), [data]);

    return (
        <div className="flex flex-col gap-4">
            <TableContainer
                items={filtered}
                menuOptions={menuOptions}
                refetch={refetch}
                title="Bookmarks"
            />
        </div>
    );
};
