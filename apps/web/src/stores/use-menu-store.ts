import { create } from "zustand";

type MenuStore = {
    isOpen: boolean;
    toggle: () => void;
    setIsOpen: (isOpen: boolean) => void;
};

export const useMenuStore = create<MenuStore>(set => ({
    isOpen: false,
    toggle: () => set(state => ({ isOpen: !state.isOpen })),
    setIsOpen: (isOpen: boolean) => set({ isOpen }),
}));
