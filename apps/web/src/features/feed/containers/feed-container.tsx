import { MenuEntries } from "@/components/shared/dropdown";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { TableContainerContent, TitleMenu } from "@/components/table/table-container-content";
import { TableContainerItems } from "@/components/table/table-container-items";
import { useMutateFeed } from "@/hooks/backend/mutators/use-mutate-feed";
import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useTableItemMenu } from "@/hooks/shared/use-table-item-menu";
import { toMilliseconds } from "@banjoanton/utils";
import { useQuery } from "@tanstack/react-query";
import { CleanFeedWithContent, CleanFeedWithItems } from "db";
import { useNavigate, useParams } from "react-router-dom";

export const FeedContainer = () => {
    const { slug } = useParams();
    const redirect = useNavigate();
    const { SWR_AUTH: fetcher } = useAuthFetcher();

    if (!slug) {
        redirect("/");
        return null;
    }

    const { data, isLoading } = useQuery<CleanFeedWithContent | CleanFeedWithItems>({
        queryKey: ["feed", slug],
        queryFn: async () => await fetcher(`/feed/${slug}`),
        staleTime: toMilliseconds({ hours: 1 }),
    });

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
