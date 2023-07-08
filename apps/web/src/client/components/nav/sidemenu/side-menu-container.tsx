"use client";

import { FC, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Category } from "@/client/components/nav/sidemenu/category";
import { Divider } from "@/client/components/nav/sidemenu/divider";
import { Item } from "@/client/components/nav/sidemenu/item";
import { Sidemenu } from "@/client/components/nav/sidemenu/menu";
import { SideMenuInput } from "@/client/components/nav/sidemenu/side-menu-input";
import { SubMenu } from "@/client/components/nav/sidemenu/sub-menu";
import { Icons } from "@/client/components/shared/icons";
import { useGet } from "@/client/hooks/backend/use-get";
import { avatarUrl } from "@/client/lib/utils";
import { CleanFeedWithItems } from "db";

type Props = {
    prefix?: string;
    feeds: CleanFeedWithItems[];
};

export const SideMenuContainer: FC<Props> = ({ prefix, feeds }) => {
    const { data } = useGet({ key: "/feed", fallbackData: feeds });
    const pathname = usePathname();

    const prefixUrl = (url: string) => {
        return prefix ? `${prefix}${url}` : url;
    };

    const isSelected = (url: string) => {
        return pathname === prefixUrl(url);
    };

    const totalUnread = useMemo(() => {
        // eslint-disable-next-line unicorn/no-array-reduce
        return data.reduce((acc, feed) => {
            if (!feed.items) {
                return acc;
            }

            return acc + feed.items.filter((item) => !item.isRead).length;
        }, 0);
    }, [data]);

    const bookmarksUnread = useMemo(() => {
        // eslint-disable-next-line unicorn/no-array-reduce
        return data.reduce((acc, feed) => {
            if (!feed.items) {
                return acc;
            }

            return (
                acc +
                feed.items.filter((item) => !item.isRead && item.isBookmarked)
                    .length
            );
        }, 0);
    }, [data]);

    const favoritesUnread = useMemo(() => {
        // eslint-disable-next-line unicorn/no-array-reduce
        return data.reduce((acc, feed) => {
            if (!feed.items) {
                return acc;
            }

            return (
                acc +
                feed.items.filter((item) => !item.isRead && item.isFavorite)
                    .length
            );
        }, 0);
    }, [data]);

    return (
        <Sidemenu>
            <Divider size="sm" />
            <Category title="Add feed" />
            <Divider size="md" />
            <SideMenuInput />
            <Divider size="lg" />
            <Category title="Menu" />
            <SubMenu>
                <Item
                    title="Home"
                    url={prefixUrl("")}
                    Icon={Icons.home}
                    selected={isSelected("")}
                    highlight={Boolean(totalUnread)}
                    notification={totalUnread > 0 ? totalUnread : undefined}
                    notificationTooltip="Unread items"
                />
                <Item
                    title="Read later"
                    url={prefixUrl("/bookmarks")}
                    Icon={Icons.bookmark}
                    selected={isSelected("/bookmarks")}
                    highlight={Boolean(bookmarksUnread)}
                    notification={
                        bookmarksUnread > 0 ? bookmarksUnread : undefined
                    }
                    notificationTooltip="Unread items"
                />
                <Item
                    title="Favorites"
                    url={prefixUrl("/favorites")}
                    Icon={Icons.star}
                    selected={isSelected("/favorites")}
                    highlight={Boolean(favoritesUnread)}
                    notification={
                        favoritesUnread > 0 ? favoritesUnread : undefined
                    }
                    notificationTooltip="Unread items"
                />
            </SubMenu>

            <Divider size="lg" />
            <Category title="Feeds" />
            <SubMenu>
                <Item
                    title="All"
                    url={prefixUrl("/all")}
                    Icon={Icons.layout}
                    selected={isSelected("/all")}
                    highlight={Boolean(totalUnread)}
                    notification={totalUnread > 0 ? totalUnread : undefined}
                    notificationTooltip="Unread items"
                />
                {data.map((feed) => {
                    const unread =
                        feed.items?.filter((item) => !item.isRead).length ?? 0;

                    return (
                        <Item
                            key={feed.id}
                            title={feed.name}
                            url={prefixUrl(`/feed/${feed.internalIdentifier}`)}
                            image={
                                feed.imageUrl ??
                                avatarUrl(feed.internalIdentifier)
                            }
                            selected={isSelected(
                                `/feed/${feed.internalIdentifier}`,
                            )}
                            notification={unread > 0 ? unread : undefined}
                            highlight={Boolean(unread)}
                            notificationTooltip="Unread items"
                        />
                    );
                })}
            </SubMenu>
        </Sidemenu>
    );
};
