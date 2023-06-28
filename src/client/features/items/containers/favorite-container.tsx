"use client";

import { TableContainer } from "@/client/components/table/table-container";
import { useItemsFetcher } from "@/client/features/items/hooks/use-items-fetcher";
import { useTableItemMenu } from "@/client/hooks/shared/use-table-item-menu";
import { CleanItem } from "@/shared/models/entities";
import { FC, useMemo } from "react";

type Props = {
    items: CleanItem[];
};

export const FavoriteContainer: FC<Props> = ({ items }) => {
    const { data, refetch } = useItemsFetcher({ key: "/items", fallbackData: items });
    const { menuOptions } = useTableItemMenu({ refetch });

    console.log("🪕%c Banjo | favorite-container.tsx:17 |", "color: #E91E63", {
        data,
        type: typeof data,
    });

    const filtered = useMemo(() => data.filter(item => item.isFavorite), [data]);

    return (
        <div className="flex flex-col gap-4">
            <TableContainer
                items={filtered}
                menuOptions={menuOptions}
                refetch={refetch}
                title="Favorites"
            />
        </div>
    );
};
