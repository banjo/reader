"use client";

import { TableContainer } from "@/client/components/table/table-container";
import { useMultipleFeedsFetcher } from "@/client/features/feed/hooks/useMultipleFeedsFetcher";
import { useTableItemMenu } from "@/client/hooks/shared/useTableItemMenu";
import { CleanFeedWithItems } from "@/shared/models/entities";
import { FC, useMemo } from "react";

type Props = {
    feeds: CleanFeedWithItems[];
};

export const BookmarkContainer: FC<Props> = ({ feeds }) => {
    const { data, refetch, refetchMultiple } = useMultipleFeedsFetcher({
        key: "/feed",
        fallbackData: feeds,
    });
    const { menuOptions } = useTableItemMenu({ refetch });

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
            Favorites
            <TableContainer feeds={filtered} menuOptions={menuOptions} refetch={refetchMultiple} />
        </div>
    );
};
