import { MenuEntries } from "@/client/components/shared/dropdown";
import { useMutateItem } from "@/client/hooks/backend/mutators/use-mutate-item";
import { Refetch } from "@/shared/models/swr";
import { ItemContent } from "@prisma/client";
import { ItemWithContent } from "db";

type Out = {
    menuOptionsItems: MenuEntries<ItemWithContent>[];
    menuOptionsContent: MenuEntries<ItemContent>[];
};

type In = {
    refetchContentMultiple: Refetch<ItemContent[]>;
    refetchItemsMultiple: Refetch<ItemWithContent[]>;
};

export const useTableItemMenu = ({ refetchItemsMultiple }: In): Out => {
    const { toggleReadStatus } = useMutateItem({
        refetch: refetchItemsMultiple,
    });

    const menuOptionsItems: MenuEntries<ItemWithContent>[] = [
        { label: "Edit", type: "label" },
        { type: "separator" },
        { type: "select", content: "Read", onSelect: () => 0 },
        {
            type: "select",
            content: item => (item.isRead ? "Mark as unread" : "Mark as read"),
            onSelect: toggleReadStatus,
        },
        {
            type: "select",
            content: "Visit site",
            onSelect: item => {
                window.open(item.content.link, "_blank");
            },
        },
    ];

    const menuOptionsContent: MenuEntries<ItemContent>[] = [];

    return {
        menuOptionsItems: menuOptionsItems,
        menuOptionsContent: menuOptionsContent,
    };
};
