"use client";

import { TableContainer } from "@/client/components/table/table-container";
import { useItemsFetcher } from "@/client/features/items/hooks/use-items-fetcher";
import { useTableItemMenu } from "@/client/hooks/shared/use-table-item-menu";
import { CleanItem } from "@/shared/models/entities";
import { FC } from "react";

type Props = {
    items: CleanItem[];
};

export const AllContainer: FC<Props> = ({ items }) => {
    const { data, refetch } = useItemsFetcher({ key: "/items", fallbackData: items });
    const { menuOptions } = useTableItemMenu({ refetch });

    return (
        <div className="flex flex-col gap-4">
            <TableContainer
                items={data}
                menuOptions={menuOptions}
                refetch={refetch}
                title={"All"}
            />
        </div>
    );
};
