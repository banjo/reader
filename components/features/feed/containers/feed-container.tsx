"use client";

import { TableContainer } from "@/components/table/table-container";
import { useTableItemMenu } from "@/hooks/shared/useTableItemMenu";
import { fetcher } from "@/lib/fetcher";
import { CleanFeedWithItems } from "@/models/entities";
import { useAuth } from "@clerk/nextjs";
import { FC } from "react";
import useSWR from "swr";

type Props = {
    feed: CleanFeedWithItems;
    publicUrl: string;
};

const useFetcher = () => {
    const { userId } = useAuth();

    if (!userId) {
        throw new Error("User is not logged in");
    }

    const api = fetcher(userId);

    return api.SWR;
};

export const FeedContainer: FC<Props> = ({ feed, publicUrl }) => {
    const get = useFetcher();
    const { data, mutate } = useSWR<CleanFeedWithItems, Error>(`feed/${publicUrl}`, get, {
        fallbackData: feed,
    });

    const refetch = async () => {
        await mutate();
    };

    const { menuOptions } = useTableItemMenu({ refetch });

    return (
        <div className="flex flex-col gap-4">
            {feed.name}
            <TableContainer feeds={data ? [data] : []} menuOptions={menuOptions} />
            <div></div>
        </div>
    );
};
