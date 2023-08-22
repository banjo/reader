import { useAuth } from "@/contexts/auth-context";
import { fetcher } from "@/lib/fetcher";

export const useAuthFetcher = () => {
    const { userId, token } = useAuth();

    if (!userId) {
        throw new Error("User is not authenticated");
    }

    const api = fetcher(token);

    return api;
};
