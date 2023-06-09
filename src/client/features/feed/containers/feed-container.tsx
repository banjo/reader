"use client";

import { TableContainer } from "@/client/components/table/table-container";
import { useFeedFetcher } from "@/client/features/feed/hooks/use-feed-fetcher";
import { useTableItemMenu } from "@/client/hooks/shared/use-table-item-menu";
import { CleanFeedWithItems } from "@/shared/models/entities";
import { FC } from "react";

type Props = {
    feed: CleanFeedWithItems;
    internalIdentifier: string;
};

export const FeedContainer: FC<Props> = ({ feed, internalIdentifier }) => {
    const { data, refetchMultiple } = useFeedFetcher({
        key: `/feed/${internalIdentifier}`,
        fallbackData: feed,
    });
    const { menuOptions } = useTableItemMenu({ refetch: refetchMultiple });

    return (
        <div className="flex flex-col gap-4">
            <TableContainer
                feeds={[data]}
                menuOptions={menuOptions}
                refetch={refetchMultiple}
                title={feed.name}
            />
        </div>
    );
};
