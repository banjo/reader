import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { toMilliseconds } from "@banjoanton/utils";
import { useQuery } from "@tanstack/react-query";
import { CleanFeedWithContent, CleanFeedWithItems } from "db";

export const useFeedFetcher = (slug: string) => {
    const { QUERY: fetcher } = useAuthFetcher();

    const { data, isLoading } = useQuery<CleanFeedWithContent | CleanFeedWithItems>({
        queryKey: ["items", "feed", slug],
        queryFn: async () => await fetcher(`/feed/${slug}`),
        staleTime: toMilliseconds({ hours: 1 }),
    });

    if (data?.isSubscribed) {
        console.log(typeof data.items[0]?.content.pubDate);
    }

    return { data, isLoading };
};
