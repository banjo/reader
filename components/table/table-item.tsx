import { Icons } from "@/components/icons";
import { CleanItem } from "@/models/entities";
import { FC } from "react";

type CardProps = {
    item: CleanItem;
    type: "list" | "card";
};

export const TableItem: FC<CardProps> = ({ item, type }) => {
    if (type === "list") {
        return (
            <div
                className="flex h-8 w-full cursor-pointer
                items-center justify-start gap-2 rounded-md  bg-slate-100
                px-2 text-sm transition-colors hover:bg-slate-200"
            >
                <Icons.star className="h-5 w-5" />
                <span className="min-w-max font-bold">{item.title}</span>
                <span className="w-0 max-w-full shrink grow truncate">{item.description}</span>
                <Icons.horizontalMenu className="ml-auto h-5 w-5" />
            </div>
        );
    }

    return (
        <div className="flex h-28 w-full rounded-md bg-foreground text-background">
            {item.title}
        </div>
    );
};
