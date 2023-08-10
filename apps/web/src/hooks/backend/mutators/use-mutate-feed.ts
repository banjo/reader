import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useInvalidate } from "@/hooks/backend/use-update-sidebar";
import { useQueryClient } from "@tanstack/react-query";
import { CleanFeedWithItems } from "db";

export const useMutateFeed = <T extends CleanFeedWithItems>() => {
    const api = useAuthFetcher();
    const queryClient = useQueryClient();
    const { invalidate } = useInvalidate();

    const unsubscribe = async (feed: T) => {
        await api.POST(`/feed/${feed.internalIdentifier}/unsubscribe`, {});
        invalidate();
    };

    return { unsubscribe };
};
