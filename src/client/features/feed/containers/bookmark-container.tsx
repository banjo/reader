"use client";

import { TableContainer } from "@/client/components/table/table-container";
import { useMultipleFeedsFetcher } from "@/client/features/feed/hooks/use-mulitple-feeds-fetcher";
import { useTableItemMenu } from "@/client/hooks/shared/use-table-item-menu";
import { CleanFeedWithItems } from "@/shared/models/entities";
import { FC, useMemo } from "react";

type Props = {
    feeds: CleanFeedWithItems[];
};

export const BookmarkContainer: FC<Props> = ({ feeds }) => {
    const { data, refetchMultiple } = useMultipleFeedsFetcher({
        key: "/feed",
        fallbackData: feeds,
    });
    const { menuOptions } = useTableItemMenu({ refetch: refetchMultiple });

    const filtered = useMemo(
        () =>
            data.map(feed => {
                return {
                    ...feed,
                    items: feed.items.filter(item => item.isBookmarked),
                };
            }),
        [data]
    );

    return (
        <div className="flex flex-col gap-4">
            <TableContainer
                feeds={filtered}
                menuOptions={menuOptions}
                refetch={refetchMultiple}
                title="Bookmarks"
            />
        </div>
    );
};
