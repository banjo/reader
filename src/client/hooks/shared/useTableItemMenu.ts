import { MenuEntries } from "@/client/components/shared/Dropdown";
import { useMutateItem } from "@/client/hooks/backend/mutators/useMutateItem";
import { CleanItem } from "@/models/entities";
import { Refetch } from "@/models/swr";

type Out<T> = {
    menuOptions: MenuEntries<T>[];
};

type In<T> = {
    refetch: Refetch<T>;
};

export const useTableItemMenu = <T extends CleanItem>({ refetch }: In<T>): Out<T> => {
    const { toggleReadStatus } = useMutateItem<T>({ refetch });

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
