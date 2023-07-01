import { UnsubscribeFn } from "@/client/features/feed/hooks/use-feed-fetcher";
import { useAuthFetcher } from "@/client/hooks/backend/use-auth-fetcher";
import { Refetch } from "@/shared/models/swr";
import { CleanFeedWithItems } from "@/shared/models/types";
import { toast } from "react-hot-toast";

type In<T> = {
    refetch: Refetch<T>;
    unsubscribeFn: UnsubscribeFn;
};

export const useMutateFeed = <T extends CleanFeedWithItems>({ unsubscribeFn }: In<T>) => {
    const api = useAuthFetcher();

    const unsubscribe = async (feed: T) => {
        const unsubscribeRequest = await api.SWR(
            `/feed/${feed.internalIdentifier}/unsubscribe`,
            "POST"
        );

        await unsubscribeFn(unsubscribeRequest, () => {
            toast.error("Failed to unsubscribe from feed");
        });
    };

    return { unsubscribe };
};
