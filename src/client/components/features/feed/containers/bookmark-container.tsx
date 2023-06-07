"use client";

import { useMultipleFeedsFetcher } from "@/client/components/features/feed/hooks/useMultipleFeedsFetcher";
import { TableContainer } from "@/client/components/table/table-container";
import { useTableItemMenu } from "@/client/hooks/shared/useTableItemMenu";
import { CleanFeedWithItems } from "@/shared/models/entities";
import { FC, useMemo } from "react";

type Props = {
    feeds: CleanFeedWithItems[];
};

export const BookmarkContainer: FC<Props> = ({ feeds }) => {
    const { data, refetch } = useMultipleFeedsFetcher({ key: "/feed", fallbackData: feeds });
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
            <TableContainer feeds={filtered} menuOptions={menuOptions} />
        </div>
    );
};
