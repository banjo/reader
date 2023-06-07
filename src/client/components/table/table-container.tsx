"use client";

import { MenuEntries } from "@/client/components/shared/Dropdown";
import { Table } from "@/client/components/table/table";
import { TableItem } from "@/client/components/table/table-item";
import { CleanFeedWithItems, CleanItem } from "@/shared/models/entities";
import { FC, useMemo } from "react";

type TableContainerProps = {
    feeds: CleanFeedWithItems[];
    menuOptions?: MenuEntries<CleanItem>[];
};

type FormattedFeed = {
    id: number;
    name: string;
    items: CleanItem[];
};

export const TableContainer: FC<TableContainerProps> = ({ feeds, menuOptions }) => {
    const multipleFeeds = useMemo(() => feeds.length > 1, [feeds]);

    const data: FormattedFeed[] = useMemo(
        () =>
            feeds.map(feed => {
                return {
                    id: feed.id,
                    name: feed.name,
                    items: feed.items,
                };
            }),
        [feeds]
    );

    return (
        <Table type="list">
            {data.map(formattedFeed => {
                return formattedFeed.items.map(item => {
                    return (
                        <TableItem
                            key={item.id}
                            item={item}
                            type="list"
                            feedName={formattedFeed.name}
                            showFeedName={multipleFeeds}
                            menuOptions={menuOptions}
                        />
                    );
                });
            })}
        </Table>
    );
};
