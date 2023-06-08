"use client";

import { TableContainer } from "@/client/components/table/table-container";
import { useMultipleFeedsFetcher } from "@/client/features/feed/hooks/useMultipleFeedsFetcher";
import { useTableItemMenu } from "@/client/hooks/shared/useTableItemMenu";
import { CleanFeedWithItems } from "@/shared/models/entities";
import { FC, useMemo } from "react";

type Props = {
    feeds: CleanFeedWithItems[];
};

export const FavoriteContainer: FC<Props> = ({ feeds }) => {
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
                    items: feed.items.filter(item => item.isFavorite),
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
                title="Favorites"
            />
        </div>
    );
};
