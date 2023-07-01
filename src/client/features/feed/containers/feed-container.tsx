"use client";

import { MenuEntries } from "@/client/components/shared/dropdown";
import { TableContainerContent } from "@/client/components/table/table-container-content";
import { TableContainerItems, TitleMenu } from "@/client/components/table/table-container-items";
import { useFeedFetcher } from "@/client/features/feed/hooks/use-feed-fetcher";
import { useMutateFeed } from "@/client/hooks/backend/mutators/use-mutate-feed";
import { useTableItemMenu } from "@/client/hooks/shared/use-table-item-menu";
import { CleanFeedWithContent, CleanFeedWithItems } from "@/shared/models/types";
import { FC } from "react";

type Props = {
    feed: CleanFeedWithItems | CleanFeedWithContent;
    internalIdentifier: string;
};

export const FeedContainer: FC<Props> = ({ feed, internalIdentifier }) => {
    const {
        data,
        refetchContentMultiple,
        refetchItemsMultiple,
        refetchFeed,
        unsubscribe: unsubscribeFn,
    } = useFeedFetcher({
        key: `/feed/${internalIdentifier}`,
        fallbackData: feed,
    });

    const { menuOptionsItems } = useTableItemMenu({
        refetchContentMultiple: refetchContentMultiple,
        refetchItemsMultiple: refetchItemsMultiple,
    });
    const { unsubscribe } = useMutateFeed({ refetch: refetchFeed, unsubscribeFn: unsubscribeFn });

    const isSubscribed = data.isSubscribed;

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
                if (isSubscribed) await unsubscribe(data);
            },
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            {isSubscribed ? (
                <TableContainerItems
                    items={data.items}
                    menuOptions={menuOptionsItems}
                    refetch={refetchItemsMultiple}
                    title={data.name}
                    titleMenuOptions={titleMenuOptions}
                    feed={data}
                />
            ) : (
                <TableContainerContent content={data.contentItems} feed={data} title={data.name} />
            )}
        </div>
    );
};
