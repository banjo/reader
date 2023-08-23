import { Icons } from "@/components/shared/icons";
import { Icon } from "@/components/shared/responsive-icon";

export const tableTypes = ["list", "card"] as const;
export type TableType = (typeof tableTypes)[number];

export const tableTypeIconMapper: Record<TableType, Icon> = {
    card: Icons.layoutCard,
    list: Icons.layoutList,
};
