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

    const { paramString: filterString, filter, keys: filterKeys, setSearch } = useFilters();

    useEffect(() => {
        paginate.setPage(1);
        setSearch("");
        // Reset the page and search when the open feed changes, not when those setters change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

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
        keepPreviousData: true,
    });

    useEffect(() => {
        if (data) {
            setTotal(data.pagination.total);
        }
    }, [data]);

    return { data: data?.data, isLoading, filter, paginate };
};
