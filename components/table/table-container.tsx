"use client";

import { Table } from "@/components/table/table";
import { TableItem } from "@/components/table/table-item";
import { CleanFeedWithItems } from "@/models/entities";
import { FC } from "react";

type TableContainerProps = {
    feed: CleanFeedWithItems;
    multipleFeeds: boolean;
};

export const TableContainer: FC<TableContainerProps> = ({ feed, multipleFeeds }) => {
    return (
        <Table type="list">
            {feed.items.map(item => {
                return (
                    <TableItem
                        key={item.id}
                        item={item}
                        type={"list"}
                        feedName={feed.name}
                        showFeedName={Boolean(multipleFeeds)}
                    />
                );
            })}
        </Table>
    );
};
