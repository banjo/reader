"use client";

import { MenuEntries } from "@/client/components/shared/dropdown";
import { TableContainer, TitleMenu } from "@/client/components/table/table-container";
import { useFeedFetcher } from "@/client/features/feed/hooks/use-feed-fetcher";
import { useMutateFeed } from "@/client/hooks/backend/mutators/use-mutate-feed";
import { useTableItemMenu } from "@/client/hooks/shared/use-table-item-menu";
import { CleanFeedWithItems } from "@/shared/models/entities";
import { FC } from "react";

type Props = {
    feed: CleanFeedWithItems;
    internalIdentifier: string;
};

export const FeedContainer: FC<Props> = ({ feed, internalIdentifier }) => {
    const {
        data,
        refetchMultiple,
        refetchFeed,
        unsubscribe: unsubscribeFn,
    } = useFeedFetcher({
        key: `/feed/${internalIdentifier}`,
        fallbackData: feed,
    });
    const { menuOptions } = useTableItemMenu({ refetch: refetchMultiple });
    const { unsubscribe } = useMutateFeed({ refetch: refetchFeed, unsubscribeFn: unsubscribeFn });

    const titleMenuOptions: MenuEntries<TitleMenu>[] = [
        {
            type: "select",
            content: "Visit page",
            onSelect: () => {
                window.open(feed.url, "_blank");
            },
        },
        {
            type: "select",
            content: "Unsubscribe",
            onSelect: async () => {
                await unsubscribe(data);
            },
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            <TableContainer
                titleMenuOptions={titleMenuOptions}
                items={[data]}
                menuOptions={menuOptions}
                refetch={refetchMultiple}
                title={feed.name}
            />
        </div>
    );
};
