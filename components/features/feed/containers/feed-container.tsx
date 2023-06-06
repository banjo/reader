"use client";

import { MenuEntries } from "@/components/shared/Dropdown";
import { TableContainer } from "@/components/table/table-container";
import { CleanFeedWithItems } from "@/models/entities";
import { FC } from "react";

type Props = {
    feed: CleanFeedWithItems;
    slug: string;
};

const menu: MenuEntries[] = [
    { label: "Edit", type: "label" },
    { type: "separator" },
    { type: "select", content: "Read", onSelect: () => 0 },
    { type: "select", content: "Mark as read", onSelect: () => 0 },
    { type: "select", content: "Visit site", onSelect: () => 0 },
];

export const FeedContainer: FC<Props> = ({ feed }) => {
    return (
        <div className="flex flex-col gap-4">
            {feed.name}
            <TableContainer feeds={[feed]} menuOptions={menu} />
            <div></div>
        </div>
    );
};
