import { useMemo, useState } from "react";

export type Paginate = {
    nextPage: () => void;
    prevPage: () => void;
    setPageSize: (pageSize: number) => void;
    hasNextPage: () => boolean;
    hasPrevPage: () => boolean;
    setPage: (page: number) => void;
    current: () => number;
    pageSize: () => number;
    isLastPage: () => boolean;
    total: () => number;
};

export const usePagination = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [total, setTotal] = useState(0);

    const paramString = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("pageSize", pageSize.toString());

        return params.toString();
    }, [page, pageSize]);

    const keys = useMemo(() => [page, pageSize] as const, [page, pageSize]);

    const paginate: Paginate = useMemo(() => {
        const isLastPage = () => page * pageSize >= total;

        return {
            nextPage: () => setPage(page => page + 1),
            prevPage: () => setPage(page => (page > 1 ? page - 1 : page)),
            setPageSize: (pageSize: number) => {
                setPageSize(pageSize);
                setPage(1);
            },
            hasNextPage: () => !isLastPage(),
            hasPrevPage: () => page > 1,
            setPage: (page: number) => setPage(page),
            current: () => page,
            pageSize: () => pageSize,
            total: () => total,
            isLastPage,
        };
    }, [page, pageSize, total]);

    return { paramString, paginate, page, pageSize, setTotal, keys };
};
