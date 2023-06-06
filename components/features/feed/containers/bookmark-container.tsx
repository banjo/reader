"use client";

import { TableContainer } from "@/components/table/table-container";
import { useGet } from "@/hooks/backend/useGet";
import { useTableItemMenu } from "@/hooks/shared/useTableItemMenu";
import { CleanFeedWithItems } from "@/models/entities";
import { FC, useMemo } from "react";

type Props = {
    feeds: CleanFeedWithItems[];
};

export const BookmarkContainer: FC<Props> = ({ feeds }) => {
    const { data, refetch } = useGet({ key: `/feed`, fallbackData: feeds });
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
