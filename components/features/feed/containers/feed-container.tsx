"use client";

import { useFeedFetcher } from "@/components/features/feed/hooks/useFeedFetcher";
import { TableContainer } from "@/components/table/table-container";
import { useTableItemMenu } from "@/hooks/shared/useTableItemMenu";
import { CleanFeedWithItems } from "@/models/entities";
import { FC } from "react";

type Props = {
    feed: CleanFeedWithItems;
    publicUrl: string;
};

export const FeedContainer: FC<Props> = ({ feed, publicUrl }) => {
    const { data, refetch } = useFeedFetcher({ key: `/feed/${publicUrl}`, fallbackData: feed });
    const { menuOptions } = useTableItemMenu({ refetch });

    return (
        <div className="flex flex-col gap-4">
            {feed.name}
            <TableContainer feeds={[data]} menuOptions={menuOptions} />
        </div>
    );
};
