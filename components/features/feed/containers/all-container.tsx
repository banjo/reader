"use client";

import { TableContainer } from "@/components/table/table-container";
import { useGet } from "@/hooks/backend/useGet";
import { useTableItemMenu } from "@/hooks/shared/useTableItemMenu";
import { CleanFeedWithItems } from "@/models/entities";
import { FC } from "react";

type Props = {
    feeds: CleanFeedWithItems[];
};

export const AllContainer: FC<Props> = ({ feeds }) => {
    const { data, refetch } = useGet({ key: `/feed`, fallbackData: feeds });
    const { menuOptions } = useTableItemMenu({ refetch });

    return (
        <div className="flex flex-col gap-4">
            All
            <TableContainer feeds={data} menuOptions={menuOptions} />
        </div>
    );
};
