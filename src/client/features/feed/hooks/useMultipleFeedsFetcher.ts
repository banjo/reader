import { useGet } from "@/client/hooks/backend/useGet";
import { CleanFeedWithItems, CleanItem } from "@/shared/models/entities";
import { Refetch } from "@/shared/models/swr";
import { toArray } from "@banjoanton/utils";

type Out = {
    data: CleanFeedWithItems[];
    isLoading: boolean;
    refetch: Refetch<CleanItem>;
    refetchMultiple: Refetch<CleanItem[]>;
    refetchAll: Refetch<CleanFeedWithItems[]>;
};
type In = {
    key: string;
    fallbackData: CleanFeedWithItems[];
};

export const useMultipleFeedsFetcher = ({ key, fallbackData }: In): Out => {
    const { data, refetch: refetchAll, isLoading } = useGet({ key, fallbackData });

    const refetchMultiple: Refetch<CleanItem[]> = (updated, updateFn) => {
        const updatedItems = toArray(updated);

        const updatedFeeds = data.map(feed => {
            return {
                ...feed,
                items: feed.items.map(item => {
                    const updatedItem = updatedItems.find(ui => ui.id === item.id);

                    if (updatedItem) {
                        return updatedItem;
                    }

                    return item;
                }),
            };
        });

        refetchAll(updatedFeeds, updateFn);
    };

    const refetch: Refetch<CleanItem> = (updated, updateFn) => {
        const updatedFeeds = data.map(feed => {
            return {
                ...feed,
                items: feed.items.map(item => {
                    if (item.id === updated.id) {
                        return updated;
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
        refetch,
        refetchAll,
        refetchMultiple,
    };
};
