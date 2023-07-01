import { Dropdown, MenuEntries } from "@/client/components/shared/dropdown";
import { Icons } from "@/client/components/shared/icons";
import { Bookmark } from "@/client/components/shared/icons/bookmark";
import { Favorite } from "@/client/components/shared/icons/favorite";
import { TableType } from "@/client/components/table/table.types";
import { useMutateItem } from "@/client/hooks/backend/mutators/use-mutate-item";
import { Refetch } from "@/shared/models/swr";
import { ItemWithContent } from "@/shared/models/types";
import { noop } from "@banjoanton/utils";
import { ItemContent } from "@prisma/client";
import { motion } from "framer-motion";

type CardPropsItem = {
    item: ItemWithContent;
    type: TableType;
    showFeedName?: boolean;
    feedName?: string;
    menuOptions?: MenuEntries<ItemWithContent>[];
    refetch: Refetch<ItemWithContent[]>;
    isSubscribed: true;
};

type CardPropsContent = {
    item: ItemContent;
    type: TableType;
    showFeedName?: boolean;
    feedName?: string;
    menuOptions?: MenuEntries<ItemContent>[];
    refetch: Refetch<ItemContent[]>;
    isSubscribed: false;
};

export const TableItem = ({
    item,
    type,
    feedName,
    showFeedName = false,
    menuOptions,
    refetch,
    isSubscribed,
}: CardPropsItem | CardPropsContent) => {
    const { toggleBookmarkStatus, toggleFavoriteStatus } = useMutateItem({
        refetch: isSubscribed ? refetch : noop,
    });

    if (type === "card") {
        throw new Error("not implemented");
    }

    const content = isSubscribed ? item.content : item;

    const toggleBookmark = () => {
        if (isSubscribed) toggleBookmarkStatus(item);
    };

    const toggleFavorite = () => {
        if (isSubscribed) toggleFavoriteStatus(item);
    };

    return (
        <motion.div
            layoutId={`table-card-${item.id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto", transition: { type: "spring", bounce: 0.3 } }} // keep in sync with height in tailwind
            style={{ minHeight: "2rem" }}
            transition={{ type: "spring", bounce: 0 }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.3 } }}
            className="relative flex w-full cursor-pointer
                items-center justify-start gap-1 overflow-hidden rounded-md
                border border-border px-2 text-sm
                transition-colors hover:bg-slate-100
                dark:border dark:bg-background dark:hover:bg-slate-900"
        >
            {isSubscribed && !item.isRead ? (
                <div className="absolute inset-y-0 left-0 w-1 bg-primary dark:bg-foreground"></div>
            ) : null}

            {isSubscribed && (
                <>
                    <Favorite size="md" active={item.isFavorite} onClick={toggleFavorite} />
                    <Bookmark size="md" active={item.isBookmarked} onClick={toggleBookmark} />
                </>
            )}

            {showFeedName && (
                <span className="w-32 min-w-max text-sm font-light text-gray-600 dark:text-gray-300">
                    {feedName}
                </span>
            )}
            <span className="min-w-max font-bold">{content.title}</span>
            <span className="w-0 max-w-full shrink grow truncate">
                {content.description ?? content.content}
            </span>
            {menuOptions && isSubscribed && (
                <Dropdown align="start" side="left" menuEntries={menuOptions} item={item}>
                    <Icons.horizontalMenu className="ml-auto h-5 w-5" />
                </Dropdown>
            )}
        </motion.div>
    );
};
