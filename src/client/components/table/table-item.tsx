import { Dropdown, MenuEntries } from "@/client/components/shared/Dropdown";
import { Icons } from "@/client/components/shared/icons";
import { Bookmark } from "@/client/components/shared/icons/bookmark";
import { Favorite } from "@/client/components/shared/icons/favorite";
import { TableType } from "@/client/components/table/table.types";
import { useMutateItem } from "@/client/hooks/backend/mutators/useMutateItem";
import { CleanItem } from "@/shared/models/entities";
import { Refetch } from "@/shared/models/swr";

type CardProps<T> = {
    item: T;
    type: TableType;
    showFeedName?: boolean;
    feedName?: string;
    menuOptions?: MenuEntries<T>[];
    refetch: Refetch<T>;
};

export const TableItem = <T extends CleanItem>({
    item,
    type,
    showFeedName = false,
    feedName,
    menuOptions,
    refetch,
}: CardProps<T>) => {
    const { toggleBookmarkStatus } = useMutateItem<T>({ refetch });

    if (type === "card") {
        throw new Error("not implemented");
    }

    const toggleBookmark = () => {
        toggleBookmarkStatus(item);
    };

    return (
        <div
            className="relative flex h-8 w-full cursor-pointer
                items-center justify-start gap-3 overflow-hidden  rounded-md
                bg-slate-100
                px-2 text-sm transition-colors hover:bg-slate-200"
        >
            {item.isRead ? null : (
                <div className="absolute inset-y-0 left-0 w-1 bg-slate-500"></div>
            )}

            <Favorite size="md" active={item.isFavorite} onClick={() => 0} />
            <Bookmark size="md" active={item.isBookmarked} onClick={toggleBookmark} />
            {showFeedName && (
                <span className="w-32 min-w-max text-sm font-light text-gray-600">{feedName}</span>
            )}
            <span className="min-w-max font-bold">{item.title}</span>
            <span className="w-0 max-w-full shrink grow truncate">{item.description}</span>
            {menuOptions && (
                <Dropdown align="start" side="left" menuEntries={menuOptions} item={item}>
                    <Icons.horizontalMenu className="ml-auto h-5 w-5" />
                </Dropdown>
            )}
        </div>
    );
};