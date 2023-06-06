"use client";

import { TableContainer } from "@/components/table/table-container";
import { useTableItemMenu } from "@/hooks/shared/useTableItemMenu";
import { CleanFeedWithItems } from "@/models/entities";
import { FC } from "react";

type Props = {
    feed: CleanFeedWithItems;
    slug: string;
};

export const FeedContainer: FC<Props> = ({ feed }) => {
    const { menuOptions } = useTableItemMenu();
    return (
        <div className="flex flex-col gap-4">
            {feed.name}
            <TableContainer feeds={[feed]} menuOptions={menuOptions} />
            <div></div>
        </div>
    );
};
