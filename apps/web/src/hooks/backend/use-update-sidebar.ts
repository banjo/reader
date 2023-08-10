import { useQueryClient } from "@tanstack/react-query";

export const useUpdateSidebar = () => {
    const queryClient = useQueryClient();

    const refetchSidebarFeed = () => {
        queryClient.invalidateQueries({
            queryKey: ["feed"],
        });
    };

    return {
        refetchSidebarFeed,
    };
};
