import { Icons } from "@/components/icons";
import { Favorite } from "@/components/shared/favorite";
import { TableType } from "@/components/table/table.types";
import { CleanItem } from "@/models/entities";
import { FC } from "react";

type CardProps = {
    item: CleanItem;
    type: TableType;
    showFeedName?: boolean;
    feedName?: string;
};

export const TableItem: FC<CardProps> = ({ item, type, showFeedName = false, feedName }) => {
    if (type === "card") {
        throw new Error("not implemented");
    }

    console.log(item.isFavorite);

    return (
        <div
            className="flex h-8 w-full cursor-pointer
                items-center justify-start gap-3 rounded-md  bg-slate-100
                px-2 text-sm transition-colors hover:bg-slate-200"
        >
            <Favorite size="md" filled={item.isFavorite} onClick={() => 0} />
            {showFeedName && (
                <span className="w-32 min-w-max text-sm font-light text-gray-600">{feedName}</span>
            )}
            <span className="min-w-max font-bold">{item.title}</span>
            <span className="w-0 max-w-full shrink grow truncate">{item.description}</span>
            <Icons.horizontalMenu className="ml-auto h-5 w-5" />
        </div>
    );
};
