import { useAuth } from "@/hooks/backend/use-auth";
import { fetcher } from "@/lib/fetcher";

export const useAuthFetcher = () => {
    const { userId } = useAuth();

    if (!userId) {
        throw new Error("User is not authenticated");
    }

    const api = fetcher(userId);

    return api;
};
