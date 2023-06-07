import { useGet } from "@/hooks/backend/useGet";
import { CleanFeedWithItems, CleanItem } from "@/models/entities";
import { Refetch } from "@/models/swr";

type Out = {
    data: CleanFeedWithItems[];
    isLoading: boolean;
    refetch: Refetch<CleanItem>;
    refetchAll: Refetch<CleanFeedWithItems[]>;
};
type In = {
    key: string;
    fallbackData: CleanFeedWithItems[];
};

export const useMultipleFeedsFetcher = ({ key, fallbackData }: In): Out => {
    const { data, refetch: refetchAll, isLoading } = useGet({ key, fallbackData });

    const refetch: Refetch<CleanItem> = (updatedItem, updateFn) => {
        const updatedFeeds = data.map(feed => {
            return {
                ...feed,
                items: feed.items.map(item => {
                    if (item.id === updatedItem.id) {
                        return updatedItem;
                    }

                    return item;
                }),
            };
        });

        refetchAll(updatedFeeds, updateFn);
    };

    return {
        data: data,
        isLoading,
        refetch: refetch,
        refetchAll,
    };
};
