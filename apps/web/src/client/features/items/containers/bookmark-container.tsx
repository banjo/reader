"use client";

import { FC, useMemo } from "react";
import { TableContainerItems } from "@/client/components/table/table-container-items";
import { useItemsFetcher } from "@/client/features/items/hooks/use-items-fetcher";
import { useTableItemMenu } from "@/client/hooks/shared/use-table-item-menu";
import { noop } from "@banjoanton/utils";
import { ItemWithContent } from "db";

type Props = {
    items: ItemWithContent[];
};

export const BookmarkContainer: FC<Props> = ({ items }) => {
    const { data, refetch } = useItemsFetcher({
        key: "/items",
        fallbackData: items,
    });
    const { menuOptionsItems } = useTableItemMenu({
        refetchItemsMultiple: refetch,
        refetchContentMultiple: noop,
    });

    const filtered = useMemo(
        () => data.filter((item) => item.isFavorite),
        [data],
    );

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
