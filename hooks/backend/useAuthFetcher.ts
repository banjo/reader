import { fetcher } from "@/src/lib/fetcher";
import { useAuth } from "@clerk/nextjs";

export const useAuthFetcher = () => {
    const { userId } = useAuth();

    if (!userId) {
        throw new Error("User is not logged in");
    }

    const api = fetcher(userId);

    return api.SWR_AUTH;
};
