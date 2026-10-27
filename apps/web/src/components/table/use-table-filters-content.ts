import { useArticleSearch } from "@/components/table/use-article-search";
import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useInvalidate } from "@/hooks/backend/use-invalidate";
import { Filter } from "@/hooks/shared/use-filters";
import { Paginate } from "@/hooks/shared/use-pagination";
import { useMutation } from "@tanstack/react-query";
import { ItemContent } from "db";

export type TableFiltersContent = {
    search: string;
    setSearch: (value: string) => void;
    clearSearch: () => void;
};

export type TableActionsContent = {
    subscribe: (internalIdentifier: string) => Promise<void>;
};

type TableFiltersOut = {
    filters: TableFiltersContent;
    data: ItemContent[];
    actions: TableActionsContent;
};

export const useTableFiltersContent = (
    data: ItemContent[],
    filter?: Filter,
    paginate?: Paginate
): TableFiltersOut => {
    const { invalidate } = useInvalidate();
    const api = useAuthFetcher();
    const articleSearch = useArticleSearch(filter, paginate);

    const mutateSubscribe = useMutation({
        mutationFn: async (internalIdentifier: string) => {
            await api.POST(`/feed/${internalIdentifier}/subscribe`, {});
        },
        onSuccess: invalidate,
    });

    // ACTIONS
    const subscribe = async (internalIdentifier: string) => {
        await mutateSubscribe.mutateAsync(internalIdentifier);
    };

    return {
        filters: articleSearch,
        data,
        actions: { subscribe },
    };
};
