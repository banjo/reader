"use client";

import { TableContainer } from "@/client/components/table/table-container";
import { useMultipleFeedsFetcher } from "@/client/features/feed/hooks/useMultipleFeedsFetcher";
import { useTableItemMenu } from "@/client/hooks/shared/useTableItemMenu";
import { CleanFeedWithItems } from "@/shared/models/entities";
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
