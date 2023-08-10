import { Category } from "@/components/nav/sidemenu/category";
import { Divider } from "@/components/nav/sidemenu/divider";
import { Item } from "@/components/nav/sidemenu/item";
import { Sidemenu } from "@/components/nav/sidemenu/menu";
import { SideMenuInput } from "@/components/nav/sidemenu/side-menu-input";
import { SubMenu } from "@/components/nav/sidemenu/sub-menu";
import { Icons } from "@/components/shared/icons";
import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { avatarUrl } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { CleanFeedWithItems } from "db";
import { FC, useMemo } from "react";
import { useLocation } from "react-router-dom";

type Props = {
    prefix?: string;
};

export const SideMenuContainer: FC<Props> = ({ prefix }) => {
    const api = useAuthFetcher();
    const { data } = useQuery<CleanFeedWithItems[]>({
        queryKey: ["feed", "all"],
        queryFn: async () => await api.QUERY("/feed"),
        initialData: [],
    });

    const { pathname } = useLocation();

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
                    notification={bookmarksUnread > 0 ? bookmarksUnread : undefined}
                    notificationTooltip="Unread items"
                />
                <Item
                    title="Favorites"
                    url={prefixUrl("/favorites")}
                    Icon={Icons.star}
                    selected={isSelected("/favorites")}
                    highlight={Boolean(favoritesUnread)}
                    notification={favoritesUnread > 0 ? favoritesUnread : undefined}
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
                {data.map(feed => {
                    const unread = feed.items?.filter(item => !item.isRead).length ?? 0;

                    return (
                        <Item
                            key={feed.id}
                            title={feed.name}
                            url={prefixUrl(`/feed/${feed.internalIdentifier}`)}
                            image={feed.imageUrl ?? avatarUrl(feed.internalIdentifier)}
                            selected={isSelected(`/feed/${feed.internalIdentifier}`)}
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
