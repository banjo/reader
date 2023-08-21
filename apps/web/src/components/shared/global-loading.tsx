import { useGlobalLoadingStore } from "@/stores/useGlobalLoadingStore";
import { FC } from "react";

export const GlobalLoading: FC = () => {
    const isLoading = useGlobalLoadingStore(state => state.isLoading);
    const loadingText = useGlobalLoadingStore(state => state.loadingText);

    if (!isLoading) {
        return null;
    }

    return (
        <>
            <div className="fixed top-0 left-0 w-full h-full z-50 flex flex-col gap-4 justify-center items-center backdrop-blur-sm">
                <div
                    className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                />
                <span>{loadingText}</span>
            </div>
        </>
    );
};
