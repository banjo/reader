import { useAuthFetcher } from "@/hooks/backend/useAuthFetcher";
import { CleanFeedWithItems, CleanItem } from "@/models/entities";
import useSWR, { mutate as globalMutate } from "swr";

type Out = {
    data: CleanFeedWithItems | undefined;
    isLoading: boolean;
    refetch: (item: CleanItem) => Promise<void>;
};

type In = {
    key: string;
    fallbackData: CleanFeedWithItems;
};

export const useFeedGet = ({ key, fallbackData }: In): Out => {
    const fetcher = useAuthFetcher();
    const { data, mutate } = useSWR<CleanFeedWithItems, Error>(key, fetcher, {
        fallbackData: fallbackData,
    });

    const refetch = async (updatedItem: CleanItem) => {
        if (!data) {
            await mutate();
            return;
        }

        const updatedFeed = data.items.map(i => {
            if (i.id === updatedItem.id) {
                return updatedItem;
            }
            return i;
        });

        const updatedData = {
            ...data,
            items: updatedFeed,
        };
        await globalMutate("/feed");
        await mutate(updatedData);
    };

    return {
        data: data,
        isLoading: !data,
        refetch: refetch,
    };
};
