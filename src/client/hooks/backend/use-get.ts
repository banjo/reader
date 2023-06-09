import { useAuthFetcher } from "@/client/hooks/backend/use-auth-fetcher";
import { Refetch } from "@/shared/models/swr";
import { useMemo } from "react";
import useSWR from "swr";

type Out<T> = {
    data: T;
    isLoading: boolean;
    refetch: Refetch<T>;
    refetchAll: () => void;
};

type In<T> = {
    key: string;
    fallbackData: T;
};

export const useGet = <T>({ key, fallbackData }: In<T>): Out<T> => {
    const { SWR_AUTH: fetcher } = useAuthFetcher();
    const { data: fetchData, mutate } = useSWR<T, Error>(key, fetcher, {
        fallbackData: fallbackData,
    });

    const data = useMemo(() => {
        return fetchData ?? fallbackData;
    }, [fallbackData, fetchData]);

    const refetchAll = () => {
        mutate();
    };

    const refetch: Refetch<T> = async (updated, updateFn, onError) => {
        if (!data) {
            mutate();
            return;
        }

        mutate(updated, false);
        try {
            await updateFn();
        } catch (error) {
            console.error(error);
            if (onError) onError();
        }
        mutate();
    };

    return {
        data: data,
        isLoading: !data,
        refetchAll,
        refetch,
    };
};
