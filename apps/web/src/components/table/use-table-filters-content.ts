import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useInvalidate } from "@/hooks/backend/use-update-sidebar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ItemContent } from "db";

export type TableFiltersContent = object;

export type TableActionsContent = {
    subscribe: (internalIdentifier: string) => Promise<void>;
};

type TableFiltersOut = {
    filters: TableFiltersContent;
    data: ItemContent[];
    actions: TableActionsContent;
};

export const useTableFiltersContent = (data: ItemContent[]): TableFiltersOut => {
    const { invalidate } = useInvalidate();
    const api = useAuthFetcher();
    const queryClient = useQueryClient();

    const mutateSubscribe = useMutation({
        mutationFn: async (internalIdentifier: string) => {
            await api.POST(`/feed/${internalIdentifier}/subscribe`, {});
        },
        onSuccess: () => {
            invalidate();
        },
    });

    // ACTIONS
    const subscribe = async (internalIdentifier: string) => {
        await mutateSubscribe.mutateAsync(internalIdentifier);
        refetchSidebarFeed();
    };

    return {
        filters: {},
        data: data,
        actions: { subscribe },
    };
};
