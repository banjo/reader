"use client";

import { useMultipleFeedsFetcher } from "@/components/features/feed/hooks/useMultipleFeedsFetcher";
import { TableContainer } from "@/components/table/table-container";
import { useTableItemMenu } from "@/hooks/shared/useTableItemMenu";
import { CleanFeedWithItems } from "@/src/models/entities";
import { FC } from "react";

type Props = {
    feeds: CleanFeedWithItems[];
};

export const AllContainer: FC<Props> = ({ feeds }) => {
    const { data, refetch } = useMultipleFeedsFetcher({ key: "/feed", fallbackData: feeds });
    const { menuOptions } = useTableItemMenu({ refetch });

    return (
        <div className="flex flex-col gap-4">
            All
            <TableContainer feeds={data} menuOptions={menuOptions} />
        </div>
    );
};
