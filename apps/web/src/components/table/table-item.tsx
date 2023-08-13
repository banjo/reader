import { Bookmark } from "@/components/icons/bookmark";
import { Favorite } from "@/components/icons/favorite";
import { Dropdown, MenuEntries } from "@/components/shared/dropdown";
import { Icons } from "@/components/shared/icons";
import { TableType } from "@/components/table/table.types";
import { useMutateItem } from "@/hooks/backend/mutators/use-mutate-item";
import { formatDistance } from "date-fns";
import { ItemContent, ItemWithContent } from "db";
import { motion } from "framer-motion";
import { useMemo } from "react";

type CardPropsItem = {
    item: ItemWithContent;
    type: TableType;
    showFeedName?: boolean;
    feedName?: string;
    menuOptions?: MenuEntries<ItemWithContent>[];
    isSubscribed: true;
    onClick: () => void;
};

type CardPropsContent = {
    item: ItemContent;
    type: TableType;
    showFeedName?: boolean;
    feedName?: string;
    menuOptions?: MenuEntries<ItemContent>[];
    isSubscribed: false;
    onClick: () => void;
};

export const TableItem = ({
    item,
    type,
    feedName,
    showFeedName = false,
    menuOptions,
    isSubscribed,
    onClick,
}: CardPropsItem | CardPropsContent) => {
    const { toggleBookmarkStatus, toggleFavoriteStatus } = useMutateItem();

    if (type === "card") {
        throw new Error("not implemented");
    }

    const content = isSubscribed ? item.content : item;
    const since = useMemo(() => {
        const LongerThanOneMonth =
            new Date().getTime() - content.pubDate.getTime() > 1000 * 60 * 60 * 24 * 30 * 1;

        if (LongerThanOneMonth) {
            return content.pubDate.toLocaleString("default", {
                month: "short",
                year: "numeric",
            });
        }
        return formatDistance(content.pubDate, new Date(), { includeSeconds: false })
            .replace("about", "")
            .replace(/ seconds?/, "s")
            .replace(/ minutes?/, "m")
            .replace(/ hours?/, "h")
            .replace(/ days?/, "d")
            .replace(/ weeks?/, "w")
            .replace(/ months?/, "mo")
            .replace(/ years?/, "y");
    }, [content]);

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
            animate={{
                opacity: 1,
                height: "auto",
                transition: { type: "spring", bounce: 0.3 },
            }} // keep in sync with height in tailwind
            style={{ minHeight: "2rem" }}
            transition={{ type: "spring", bounce: 0 }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.3 } }}
            className="border-border dark:bg-background relative flex
                w-full cursor-pointer items-center justify-start gap-2
                overflow-hidden rounded-md border px-2
                text-sm transition-colors
                hover:bg-slate-100 dark:border dark:hover:bg-slate-900"
        >
            {isSubscribed && !item.isRead ? (
                <div className="bg-primary dark:bg-foreground absolute inset-y-0 left-0 w-1"></div>
            ) : null}

            {isSubscribed && (
                <>
                    <Favorite size="md" active={item.isFavorite} onClick={toggleFavorite} />
                    <Bookmark size="md" active={item.isBookmarked} onClick={toggleBookmark} />
                </>
            )}

            {showFeedName && (
                <span
                    className="w-32 min-w-max text-sm font-light text-gray-600 dark:text-gray-300"
                    onClick={onClick}
                >
                    {feedName}
                </span>
            )}
            <span className="font-bold whitespace-nowrap truncate" onClick={onClick}>
                {content.title}
            </span>
            <span className="w-0 max-w-full shrink grow truncate" onClick={onClick}>
                {content.description ?? content.content}
            </span>

            <span className="w-20 text-right">{since}</span>
            {menuOptions && isSubscribed && (
                <Dropdown align="start" side="left" menuEntries={menuOptions} item={item}>
                    <Icons.horizontalMenu className="ml-auto h-5 w-5" />
                </Dropdown>
            )}
        </motion.div>
    );
};
