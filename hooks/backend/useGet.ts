import { useAuthFetcher } from "@/hooks/backend/useAuthFetcher";
import { useMemo } from "react";
import useSWR from "swr";

type Out<T> = {
    data: T;
    isLoading: boolean;
    refetch: () => Promise<void>;
};

type In<T> = {
    key: string;
    fallbackData: T;
};

export const useGet = <T>({ key, fallbackData }: In<T>): Out<T> => {
    const fetcher = useAuthFetcher();
    const { data: fetchData, mutate } = useSWR<T, Error>(key, fetcher, {
        fallbackData: fallbackData,
    });

    const data = useMemo(() => {
        return fetchData ?? fallbackData;
    }, [fallbackData, fetchData]);

    const refetch = async () => {
        await mutate();
    };

    return {
        data: data,
        isLoading: !data,
        refetch: refetch,
    };
};
