"use client";

import { Table } from "@/components/table/table";
import { TableItem } from "@/components/table/table-item";
import { CleanFeedWithItems, CleanItem } from "@/models/entities";
import { FC, useMemo } from "react";

type TableContainerProps = {
    feeds: CleanFeedWithItems[];
};

type FormattedFeed = {
    id: number;
    name: string;
    items: CleanItem[];
};

export const TableContainer: FC<TableContainerProps> = ({ feeds }) => {
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
                        />
                    );
                });
            })}
        </Table>
    );
};
