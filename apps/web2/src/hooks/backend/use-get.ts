import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { Refetch } from "@/models/swr";
import { Maybe } from "@banjoanton/utils";
import useSWR from "swr";

type Out<T> = {
    data: Maybe<T>;
    isLoading: boolean;
    refetch: Refetch<T>;
    refetchAll: () => void;
};

type In = {
    key: string;
};

export const useGet = <T>({ key }: In): Out<T> => {
    const { SWR_AUTH: fetcher } = useAuthFetcher();

    const { data, mutate } = useSWR<T, Error>(key, fetcher);

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
