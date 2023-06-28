import { Dropdown, MenuEntries } from "@/client/components/shared/dropdown";
import { Icons } from "@/client/components/shared/icons";
import { Bookmark } from "@/client/components/shared/icons/bookmark";
import { Favorite } from "@/client/components/shared/icons/favorite";
import { TableType } from "@/client/components/table/table.types";
import { useMutateItem } from "@/client/hooks/backend/mutators/use-mutate-item";
import { CleanItem } from "@/shared/models/entities";
import { Refetch } from "@/shared/models/swr";
import { motion } from "framer-motion";

type CardProps<T> = {
    item: T;
    type: TableType;
    showFeedName?: boolean;
    feedName?: string;
    menuOptions?: MenuEntries<T>[];
    refetch: Refetch<T[]>;
};

export const TableItem = <T extends CleanItem>({
    item,
    type,
    showFeedName = false,
    menuOptions,
    refetch,
}: CardProps<T>) => {
    const { toggleBookmarkStatus, toggleFavoriteStatus } = useMutateItem<T>({ refetch });
    const { content, id, isRead, isFavorite, isBookmarked, feed } = item;

    if (type === "card") {
        throw new Error("not implemented");
    }

    const toggleBookmark = () => {
        toggleBookmarkStatus(item);
    };

    const toggleFavorite = () => {
        toggleFavoriteStatus(item);
    };

    return (
        <motion.div
            layoutId={`table-card-${id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto", transition: { type: "spring", bounce: 0.3 } }} // keep in sync with height in tailwind
            style={{ minHeight: "2rem" }}
            transition={{ type: "spring", bounce: 0 }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.3 } }}
            className="relative flex w-full cursor-pointer
                items-center justify-start gap-3 overflow-hidden rounded-md
                border border-border px-2 text-sm
                transition-colors hover:bg-slate-100
                dark:border dark:bg-background dark:hover:bg-slate-900"
        >
            {isRead ? null : (
                <div className="absolute inset-y-0 left-0 w-1 bg-primary dark:bg-foreground"></div>
            )}

            <Favorite size="md" active={isFavorite} onClick={toggleFavorite} />
            <Bookmark size="md" active={isBookmarked} onClick={toggleBookmark} />
            {showFeedName && (
                <span className="w-32 min-w-max text-sm font-light text-gray-600 dark:text-gray-300">
                    {feed.name}
                </span>
            )}
            <span className="min-w-max font-bold">{content.title}</span>
            <span className="w-0 max-w-full shrink grow truncate">
                {content.description ?? content.content}
            </span>
            {menuOptions && (
                <Dropdown align="start" side="left" menuEntries={menuOptions} item={item}>
                    <Icons.horizontalMenu className="ml-auto h-5 w-5" />
                </Dropdown>
            )}
        </motion.div>
    );
};
