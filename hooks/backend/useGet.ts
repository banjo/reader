import { useAuthFetcher } from "@/hooks/backend/useAuthFetcher";
import useSWR from "swr";

type Out<T> = {
    data: T | undefined;
    isLoading: boolean;
    refetch: () => Promise<void>;
};

type In<T> = {
    key: string;
    fallbackData: T;
};

export const useGet = <T>({ key, fallbackData }: In<T>): Out<T> => {
    const fetcher = useAuthFetcher();
    const { data, mutate } = useSWR<T, Error>(key, fetcher, {
        fallbackData: fallbackData,
    });

    const refetch = async () => {
        await mutate();
    };

    return {
        data: data,
        isLoading: !data,
        refetch: refetch,
    };
};
