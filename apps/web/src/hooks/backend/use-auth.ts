import { useAuth as useClerkAuth } from "@clerk/clerk-react";

export const useAuth = () => {
    const auth = useClerkAuth();
    return auth;
};
