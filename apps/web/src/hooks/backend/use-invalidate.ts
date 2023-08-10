import { useQueryClient } from "@tanstack/react-query";

export const useInvalidate = () => {
    const queryClient = useQueryClient();

    const invalidate = async () => {
        await queryClient.invalidateQueries({ queryKey: ["items"] });
    };

    const cancelQueries = async () => {
        await queryClient.cancelQueries({ queryKey: ["items"] });
    };

    return {
        invalidate,
        cancelQueries,
        queryClient,
    };
};
