import { useQueryClient } from "@tanstack/react-query";

export const useInvalidate = () => {
    const queryClient = useQueryClient();

    const invalidate = async () => {
        await queryClient.invalidateQueries({ queryKey: ["items"] });
    };

    const cancelQueries = async () => {
        await queryClient.cancelQueries({ queryKey: ["items"] });
    };

    const refetch = async () => {
        await queryClient.refetchQueries({ queryKey: ["items"] });
    };

    const clear = () => {
        queryClient.removeQueries();
    };

    return {
        invalidate,
        cancelQueries,
        refetch,
        clear,
        queryClient,
    };
};
