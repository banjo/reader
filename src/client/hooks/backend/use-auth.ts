import { useAuth as useClerkAuth } from "@clerk/nextjs";

export const useAuth = () => {
    const auth = useClerkAuth();
    return auth;
};
