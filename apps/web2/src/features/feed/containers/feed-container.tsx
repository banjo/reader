import { MenuEntries } from "@/components/shared/dropdown";
import { TableContainerContent, TitleMenu } from "@/components/table/table-container-content";
import { TableContainerItems } from "@/components/table/table-container-items";
import { useFeedFetcher } from "@/features/feed/hooks/use-feed-fetcher";
import { useMutateFeed } from "@/hooks/backend/mutators/use-mutate-feed";
import { useTableItemMenu } from "@/hooks/shared/use-table-item-menu";
import { useParams } from "react-router-dom";

export const FeedContainer = () => {
    const { slug } = useParams();
    const {
        data,
        refetchContentMultiple,
        refetchItemsMultiple,
        refetchFeed,
        unsubscribe: unsubscribeFn,
    } = useFeedFetcher({
        key: `/feed/${slug}`,
    });

    const { menuOptionsItems } = useTableItemMenu({
        refetchContentMultiple: refetchContentMultiple,
        refetchItemsMultiple: refetchItemsMultiple,
    });
    const { unsubscribe } = useMutateFeed({
        refetch: refetchFeed,
        unsubscribeFn: unsubscribeFn,
    });

    if (!data) return null;

    const isSubscribed = data.isSubscribed;

    const titleMenuOptions: MenuEntries<TitleMenu>[] = [
        {
            type: "select",
            content: "Visit page",
            onSelect: () => {
                window.open(data.url, "_blank");
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
