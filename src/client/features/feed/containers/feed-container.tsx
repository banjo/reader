"use client";

import { TableContainer } from "@/client/components/table/table-container";
import { useFeedFetcher } from "@/client/features/feed/hooks/useFeedFetcher";
import { useTableItemMenu } from "@/client/hooks/shared/useTableItemMenu";
import { CleanFeedWithItems } from "@/shared/models/entities";
import { FC } from "react";

type Props = {
    feed: CleanFeedWithItems;
    publicUrl: string;
};

export const FeedContainer: FC<Props> = ({ feed, publicUrl }) => {
    const { data, refetch, refetchMultiple } = useFeedFetcher({
        key: `/feed/${publicUrl}`,
        fallbackData: feed,
    });
    const { menuOptions } = useTableItemMenu({ refetch });

    return (
        <div className="flex flex-col gap-4">
            {feed.name}
            <TableContainer
                feeds={[data]}
                menuOptions={menuOptions}
                refetch={refetch}
                refetchMultiple={refetchMultiple}
            />
        </div>
    );
};
