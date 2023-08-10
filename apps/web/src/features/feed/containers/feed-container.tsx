import { MenuEntries } from "@/components/shared/dropdown";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { TableContainerContent, TitleMenu } from "@/components/table/table-container-content";
import { TableContainerItems } from "@/components/table/table-container-items";
import { useFeedFetcher } from "@/features/feed/hooks/use-feed-fetcher";
import { useMutateFeed } from "@/hooks/backend/mutators/use-mutate-feed";
import { useTableItemMenu } from "@/hooks/shared/use-table-item-menu";
import { useNavigate, useParams } from "react-router-dom";

export const FeedContainer = () => {
    const { slug } = useParams();
    const redirect = useNavigate();

    if (!slug) {
        redirect("/");
        return null;
    }

    const { data, isLoading } = useFeedFetcher(slug);
    const { menuOptionsItems } = useTableItemMenu();
    const { unsubscribe } = useMutateFeed();

    if (isLoading) return <TableSkeleton />;
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
