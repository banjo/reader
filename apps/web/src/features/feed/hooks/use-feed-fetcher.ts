import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useFilters } from "@/hooks/shared/use-filters";
import { usePagination } from "@/hooks/shared/use-pagination";
import { toMilliseconds } from "@banjoanton/utils";
import { useQuery } from "@tanstack/react-query";
import { CleanFeedWithContent, CleanFeedWithItems } from "db";
import { PaginationResponse } from "model";
import { useEffect, useMemo } from "react";

export const useFeedFetcher = (slug: string) => {
    const { QUERY: fetcher } = useAuthFetcher();

    const {
        paramString: paginationString,
        paginate,
        setTotal,
        keys: paginationKeys,
    } = usePagination();

    const { paramString: filterString, filter, keys: filterKeys } = useFilters();

    const url = useMemo(
        () => `/feed/${slug}?${paginationString}&${filterString}`,
        [paginationString, filterString, slug]
    );

    const { data, isLoading } = useQuery<
        PaginationResponse<CleanFeedWithContent | CleanFeedWithItems>
    >({
        queryKey: ["items", "feed", slug, ...paginationKeys, ...filterKeys],
        queryFn: async () => await fetcher(url),
        staleTime: toMilliseconds({ hours: 1 }),
    });

    useEffect(() => {
        if (data) {
            setTotal(data.pagination.total);
        }
    }, [data]);

    return { data: data?.data, isLoading, filter, paginate };
};
