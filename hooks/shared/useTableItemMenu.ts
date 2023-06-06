import { MenuEntries } from "@/components/shared/Dropdown";
import { useUpdateItem } from "@/hooks/useUpdateItem";
import { CleanItem } from "@/models/entities";

type Out<T> = {
    menuOptions: MenuEntries<T>[];
};

export const useTableItemMenu = <T extends CleanItem>(): Out<T> => {
    const { toggleReadStatus } = useUpdateItem<CleanItem>();

    const menuOptions: MenuEntries<T>[] = [
        { label: "Edit", type: "label" },
        { type: "separator" },
        { type: "select", content: "Read", onSelect: () => 0 },
        { type: "select", content: "Mark as read", onSelect: toggleReadStatus },
        { type: "select", content: "Visit site", onSelect: () => 0 },
    ];

    return {
        menuOptions: menuOptions,
    };
};
