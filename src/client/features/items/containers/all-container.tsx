"use client";

import { TableContainerItems } from "@/client/components/table/table-container-items";
import { useItemsFetcher } from "@/client/features/items/hooks/use-items-fetcher";
import { useTableItemMenu } from "@/client/hooks/shared/use-table-item-menu";
import { ItemWithContent } from "@/shared/models/types";
import { noop } from "@banjoanton/utils";
import { FC } from "react";

type Props = {
    items: ItemWithContent[];
};

export const AllContainer: FC<Props> = ({ items }) => {
    const { data, refetch } = useItemsFetcher({ key: "/items", fallbackData: items });
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
