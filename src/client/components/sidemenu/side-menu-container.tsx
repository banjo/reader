"use client";

import { Icons } from "@/client/components/shared/icons";
import { Category } from "@/client/components/sidemenu/category";
import { Divider } from "@/client/components/sidemenu/divider";
import { Input } from "@/client/components/sidemenu/input";
import { Item } from "@/client/components/sidemenu/item";
import { Sidemenu } from "@/client/components/sidemenu/menu";
import { SubMenu } from "@/client/components/sidemenu/sub-menu";
import { useGet } from "@/client/hooks/backend/useGet";
import { avatarUrl } from "@/client/lib/utils";
import { CleanFeedWithItems } from "@/shared/models/entities";
import { usePathname } from "next/navigation";
import { FC, useMemo } from "react";

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

            return acc + feed.items.filter(item => !item.isRead).length;
        }, 0);
    }, [data]);

    const bookmarksUnread = useMemo(() => {
        // eslint-disable-next-line unicorn/no-array-reduce
        return data.reduce((acc, feed) => {
            if (!feed.items) {
                return acc;
            }

            return acc + feed.items.filter(item => !item.isRead && item.isBookmarked).length;
        }, 0);
    }, [data]);

    const favoritesUnread = useMemo(() => {
        // eslint-disable-next-line unicorn/no-array-reduce
        return data.reduce((acc, feed) => {
            if (!feed.items) {
                return acc;
            }

            return acc + feed.items.filter(item => !item.isRead && item.isFavorite).length;
        }, 0);
    }, [data]);

    return (
        <Sidemenu>
            <Divider size="sm" />
            <Category title="Add feed" />
            <Divider size="md" />
            <Input />
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
                />
                <Item
                    title="Read later"
                    url={prefixUrl("/bookmarks")}
                    Icon={Icons.bookmark}
                    selected={isSelected("/bookmarks")}
                    highlight={Boolean(bookmarksUnread)}
                    notification={bookmarksUnread > 0 ? bookmarksUnread : undefined}
                />
                <Item
                    title="Favorites"
                    url={prefixUrl("/favorites")}
                    Icon={Icons.star}
                    selected={isSelected("/favorites")}
                    highlight={Boolean(favoritesUnread)}
                    notification={favoritesUnread > 0 ? favoritesUnread : undefined}
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
                />
                {data.map(feed => {
                    const unread = feed.items?.filter(item => !item.isRead).length ?? 0;

                    return (
                        <Item
                            key={feed.id}
                            title={feed.name}
                            url={prefixUrl(`/feed/${feed.publicUrl}`)}
                            image={feed.imageUrl ?? avatarUrl(feed.publicUrl)}
                            selected={isSelected(`/feed/${feed.publicUrl}`)}
                            notification={unread > 0 ? unread : undefined}
                            highlight={Boolean(unread)}
                        />
                    );
                })}
            </SubMenu>
        </Sidemenu>
    );
};
