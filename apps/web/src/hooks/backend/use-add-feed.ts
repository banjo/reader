import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";

export type FeedAddManyReturnType = {
    total: number;
    success: number;
    errors: {
        url: string;
        message: string;
        type: string;
    }[];
};

export const useAddFeed = () => {
    const api = useAuthFetcher();

    const addMany = async (urls: string[]) =>
        await api.POST<FeedAddManyReturnType>(`/feed/add-many`, { urls });

    return { addMany };
};
