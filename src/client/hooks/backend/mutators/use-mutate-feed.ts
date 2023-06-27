import { UnsubscribeFn } from "@/client/features/feed/hooks/use-feed-fetcher";
import { useAuth } from "@/client/hooks/backend/use-auth";
import { fetcher } from "@/client/lib/fetcher";
import { CleanFeedWithItems } from "@/shared/models/entities";
import { Refetch } from "@/shared/models/swr";
import { toast } from "react-hot-toast";

type In<T> = {
    refetch: Refetch<T>;
    unsubscribeFn: UnsubscribeFn;
};

export const useMutateFeed = <T extends CleanFeedWithItems>({ unsubscribeFn }: In<T>) => {
    const { userId } = useAuth();

    if (!userId) {
        throw new Error("No user id");
    }

    const api = fetcher(userId);

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
