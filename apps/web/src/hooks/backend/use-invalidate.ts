import { useQueryClient } from "@tanstack/react-query";

export const useInvalidate = () => {
    const queryClient = useQueryClient();

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["feed"] });
        queryClient.invalidateQueries({ queryKey: ["items"] });
    };

    return {
        invalidate,
    };
};
