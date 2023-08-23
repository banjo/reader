import { TableType } from "@/components/table/table.types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type TableTypeStore = {
    current: TableType;
    setCurrent: (current: TableType) => void;
};

export const useTableTypeStore = create<TableTypeStore>()(
    persist(
        (set, get) => ({
            current: "list",
            setCurrent: (current: TableType) => set({ current }),
        }),
        {
            name: "use-table-type-store",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
