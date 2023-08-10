import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useQueryClient } from "@tanstack/react-query";
import { CleanFeedWithItems } from "db";

export const useMutateFeed = <T extends CleanFeedWithItems>() => {
    const api = useAuthFetcher();
    const queryClient = useQueryClient();

    const unsubscribe = async (feed: T) => {
        // TODO: add unsubscribe to api server again
        await api.POST(`/feed/${feed.internalIdentifier}/unsubscribe`, {});

        queryClient.invalidateQueries({ queryKey: ["feed"] });
    };

    return { unsubscribe };
};
