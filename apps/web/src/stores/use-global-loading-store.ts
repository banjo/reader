import { create } from "zustand";

type useGlobalLoadingStore = {
    isLoading: boolean;
    loadingText?: string;
    setIsLoading: (isLoading: boolean, loadingText?: string) => void;
};

export const useGlobalLoadingStore = create<useGlobalLoadingStore>(set => ({
    isLoading: false,
    loadingText: undefined,
    setIsLoading: (isLoading: boolean, loadingText?: string) => set({ isLoading, loadingText }),
}));
