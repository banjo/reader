import { useMemo } from "react";
import { useAuthFetcher } from "@/client/hooks/backend/use-auth-fetcher";
import { useUpdateSidebar } from "@/client/hooks/backend/use-update-sidebar";
import { Refetch, RefetchOnError, RefetchUpdateFn } from "@/shared/models/swr";
import { ItemContent } from "@prisma/client";
import { CleanFeedWithContent, CleanFeedWithItems, ItemWithContent } from "db";
import useSWR from "swr";

type Out = {
    data: CleanFeedWithItems | CleanFeedWithContent;
    isLoading: boolean;
    refetchFeed: Refetch<CleanFeedWithItems | CleanFeedWithContent>;
    refetchContent: Refetch<ItemContent>;
    refetchItems: Refetch<ItemWithContent>;
    refetchContentMultiple: Refetch<ItemContent[]>;
    refetchItemsMultiple: Refetch<ItemWithContent[]>;
    unsubscribe: (
        updateFn: () => Promise<undefined>,
        onError: () => void,
    ) => Promise<void>;
};

type In = {
    key: string;
    fallbackData: CleanFeedWithItems | CleanFeedWithContent;
};

export type UnsubscribeFn = (
    updateFn: () => Promise<undefined>,
    onError: () => void,
) => Promise<void>;

type MutationPropsMultipleItems = {
    isSubscribed: true;
    updatedData: CleanFeedWithItems;
    updatedItems: ItemWithContent[];
    updateFn: RefetchUpdateFn;
    onError?: RefetchOnError;
};

type MutationPropsMultipleContent = {
    isSubscribed: false;
    updatedData: CleanFeedWithContent;
    updatedItems: ItemContent[];
    updateFn: RefetchUpdateFn;
    onError?: RefetchOnError;
};

type MutationPropsItems = {
    isSubscribed: true;
    updatedData: CleanFeedWithItems;
    updatedItem: ItemWithContent;
    updateFn: RefetchUpdateFn;
    onError?: RefetchOnError;
};

type MutationPropsContent = {
    isSubscribed: false;
    updatedData: CleanFeedWithContent;
    updatedItem: ItemContent;
    updateFn: RefetchUpdateFn;
    onError?: RefetchOnError;
};

export const useFeedFetcher = ({ key, fallbackData }: In): Out => {
    const { SWR_AUTH: fetcher } = useAuthFetcher();
    const { fetchLatestInSidebar, mutateSidebarItem, mutateSidebarItems } =
        useUpdateSidebar();

    const { data: fetchData, mutate } = useSWR<
        CleanFeedWithItems | CleanFeedWithContent,
        Error
    >(key, fetcher, {
        fallbackData: fallbackData,
    });

    const data = useMemo(() => {
        return fetchData ?? fallbackData;
    }, [fallbackData, fetchData]);

    const unsubscribe: UnsubscribeFn = async (updateFn, onError) => {
        mutate(undefined, false);
        mutateSidebarItems([]);

        try {
            await updateFn();
        } catch (error) {
            console.error(error);
            if (onError) onError();
        }

        mutate();
        fetchLatestInSidebar();
    };

    const refetchFeed: Refetch<
        CleanFeedWithItems | CleanFeedWithContent
    > = async (updatedFeed, updateFn, onError) => {
        const updatedData = {
            ...data,
            ...updatedFeed,
        };

        mutate(updatedData, false);

        if (updatedFeed.isSubscribed) {
            mutateSidebarItems(updatedFeed.items);
        }

        try {
            await updateFn();
        } catch (error) {
            console.error(error);
            if (onError) onError();
        }

        mutate();
        fetchLatestInSidebar();
    };

    // Shared mutation and update function
    const tryMutationAndUpdate = async ({
        isSubscribed,
        updatedData,
        updatedItem,
        updateFn,
        onError,
    }: MutationPropsItems | MutationPropsContent) => {
        mutate(updatedData, false);
        if (isSubscribed) mutateSidebarItem(updatedItem);

        try {
            // Attempt the update function
            await updateFn();
        } catch (error) {
            // Catch and log any errors
            console.error(error);
            if (onError) onError();
        }

        // Further mutation
        mutate();
        fetchLatestInSidebar();
    };

    // Function for handling subscribed data
    const refetchItems: Refetch<ItemWithContent> = async (
        updatedItem,
        updateFn,
        onError,
    ) => {
        if (!data.isSubscribed) {
            throw new Error(
                "Cannot fetch content items when items are present",
            );
        }

        const updatedItems = data.items.map((i) => {
            if (i.id === updatedItem.id) {
                return updatedItem;
            }
            return i;
        });

        const updatedData = {
            ...data,
            items: updatedItems,
        };

        await tryMutationAndUpdate({
            updatedData,
            updatedItem,
            updateFn,
            onError,
            isSubscribed: true,
        });
    };

    // Function for handling non-subscribed data
    const refetchContent: Refetch<ItemContent> = async (
        updatedItem,
        updateFn,
        onError,
    ) => {
        if (data.isSubscribed) {
            throw new Error(
                "Cannot fetch content items when items are present",
            );
        }

        const updatedContent: ItemContent[] = data.contentItems.map((c) => {
            if (c.id === updatedItem.id) {
                return updatedItem;
            }
            return c;
        });

        const updatedData = {
            ...data,
            contentItems: updatedContent,
        };

        await tryMutationAndUpdate({
            updatedData,
            updatedItem,
            updateFn,
            onError,
            isSubscribed: false,
        });
    };

    // Shared mutation and update function
    const tryMutationAndUpdateMultiple = async ({
        isSubscribed,
        updatedData,
        updatedItems,
        updateFn,
        onError,
    }: MutationPropsMultipleItems | MutationPropsMultipleContent) => {
        mutate(updatedData, false);
        if (isSubscribed) {
            mutateSidebarItems(updatedItems);
        }
        try {
            // Attempt the update function
            await updateFn();
        } catch (error) {
            // Catch and log any errors
            console.error(error);
            if (onError) onError();
        }

        // Further mutation
        mutate();
        fetchLatestInSidebar();
    };

    // Function for handling multiple content update
    const refetchContentMultiple: Refetch<ItemContent[]> = async (
        updatedItems,
        updateFn,
        onError,
    ) => {
        if (data.isSubscribed) {
            throw new Error(
                "Cannot fetch content items when items are present",
            );
        }

        const updatedContent: ItemContent[] = data.contentItems.map((c) => {
            const updatedItem = updatedItems.find((ui) => ui.id === c.id);

            if (updatedItem) {
                return updatedItem;
            }

            return c;
        });

        const updatedData = {
            ...data,
            contentItems: updatedContent,
        };

        await tryMutationAndUpdateMultiple({
            updatedData,
            updatedItems,
            updateFn,
            onError,
            isSubscribed: false,
        });
    };

    // Function for handling multiple items update
    const refetchItemsMultiple: Refetch<ItemWithContent[]> = async (
        updatedItems,
        updateFn,
        onError,
    ) => {
        if (!data.isSubscribed) {
            throw new Error("Cannot fetch items when contentItems are present");
        }

        const updatedFeed = data.items.map((i) => {
            const updatedItem = updatedItems.find((ui) => ui.id === i.id);

            if (updatedItem) {
                return updatedItem;
            }

            return i;
        });

        const updatedData = {
            ...data,
            items: updatedFeed,
        };

        await tryMutationAndUpdateMultiple({
            updatedData,
            updatedItems,
            updateFn,
            onError,
            isSubscribed: true,
        });
    };

    return {
        data,
        isLoading: !data,
        refetchFeed,
        refetchItems,
        refetchContent,
        refetchContentMultiple,
        refetchItemsMultiple,
        unsubscribe,
    };
};
