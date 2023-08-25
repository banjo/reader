import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { Result } from "@/lib/result";

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

    const addMany = async (urls: string[]) => {
        // this solution does not work because the backend crashes on Promise.allSettled
        // await api.POST<FeedAddManyReturnType>(`/feed/add-many`, { urls });

        const results = await Promise.allSettled(urls.map(url => api.POST(`/feed`, { url })));

        const total = results.length;
        const success = results.filter(result => result.status === "fulfilled").length;

        const errors = results
            .filter(result => result.status === "rejected")
            .map(r => {
                const result = r as PromiseRejectedResult;

                return {
                    url: result.reason.url,
                    message: result.reason.message,
                    type: result.reason.type,
                };
            });

        return Result.ok({ total, success, errors });
    };
    return { addMany };
};
