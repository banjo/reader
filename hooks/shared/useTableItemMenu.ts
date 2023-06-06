import { MenuEntries } from "@/components/shared/Dropdown";
import { useUpdateItem } from "@/hooks/useUpdateItem";
import { CleanItem } from "@/models/entities";

type Out<T> = {
    menuOptions: MenuEntries<T>[];
};

type In = {
    refetch: () => Promise<void>;
};

export const useTableItemMenu = <T extends CleanItem>({ refetch }: In): Out<T> => {
    const { toggleReadStatus } = useUpdateItem<CleanItem>({ refetch });

    const menuOptions: MenuEntries<T>[] = [
        { label: "Edit", type: "label" },
        { type: "separator" },
        { type: "select", content: "Read", onSelect: () => 0 },
        {
            type: "select",
            content: item => (item.isRead ? "Mark as unread" : "Mark as read"),
            onSelect: toggleReadStatus,
        },
        { type: "select", content: "Visit site", onSelect: () => 0 },
    ];

    return {
        menuOptions: menuOptions,
    };
};
