import { fetcher } from "@/client/lib/fetcher";
import { useAuth } from "@clerk/nextjs";

export const useAuthFetcher = () => {
    const { userId } = useAuth();

    if (!userId) {
        throw new Error("User is not authenticated");
    }

    const api = fetcher(userId);

    return api;
};
