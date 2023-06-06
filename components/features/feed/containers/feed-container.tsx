"use client";

import { TableContainer } from "@/components/table/table-container";
import { useFeedGet } from "@/hooks/backend/getters/useFeedGet";
import { useTableItemMenu } from "@/hooks/shared/useTableItemMenu";
import { CleanFeedWithItems } from "@/models/entities";
import { FC } from "react";

type Props = {
    feed: CleanFeedWithItems;
    publicUrl: string;
};

export const FeedContainer: FC<Props> = ({ feed, publicUrl }) => {
    const { data, refetch } = useFeedGet({ key: `/feed/${publicUrl}`, fallbackData: feed });
    const { menuOptions } = useTableItemMenu({ refetch });

    return (
        <div className="flex flex-col gap-4">
            {feed.name}
            <TableContainer feeds={data ? [data] : []} menuOptions={menuOptions} />
            <div></div>
        </div>
    );
};
