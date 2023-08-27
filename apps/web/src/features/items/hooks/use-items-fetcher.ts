import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useFilters } from "@/hooks/shared/use-filters";
import { usePagination } from "@/hooks/shared/use-pagination";
import { toMilliseconds } from "@banjoanton/utils";
import { useQuery } from "@tanstack/react-query";
import { ItemWithContent } from "db";
import { PaginationResponse } from "model";
import { useEffect, useMemo } from "react";

export const useItemsFetcher = () => {
    const { QUERY: fetcher } = useAuthFetcher();
    const {
        paramString: paginationString,
        paginate,
        page,
        pageSize,
        setTotal,
        keys: paginationKeys,
    } = usePagination();

    const { paramString: filterString, filter, keys: filterKeys } = useFilters();

    const url = useMemo(
        () => `/items?${paginationString}&${filterString}`,
        [paginationString, filterString]
    );

    const initialData: PaginationResponse<ItemWithContent[]> = useMemo(
        () => ({
            data: [],
            pagination: {
                page,
                pageSize,
                total: 0,
            },
        }),
        []
    );

    const { data, isLoading } = useQuery<PaginationResponse<ItemWithContent[]>>({
        queryKey: ["items", ...paginationKeys, ...filterKeys],
        queryFn: async () => await fetcher(url),
        staleTime: toMilliseconds({ hours: 1 }),
        initialData: initialData,
        initialDataUpdatedAt: 0,
    });

    useEffect(() => {
        if (data) {
            setTotal(data.pagination.total);
        }
    }, [data]);

    return { data: data.data, isLoading, paginate, filter };
};
