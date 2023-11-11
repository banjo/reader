import { Category } from "@/components/nav/sidemenu/category";
import { Divider } from "@/components/nav/sidemenu/divider";
import { Item } from "@/components/nav/sidemenu/item";
import { SideMenu } from "@/components/nav/sidemenu/menu";
import { SubMenu } from "@/components/nav/sidemenu/sub-menu";
import { Icons } from "@/components/shared/icons";
import { ResponsiveIcon } from "@/components/shared/responsive-icon";
import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { avatarUrl } from "@/lib/utils";
import { useMenuStore } from "@/stores/use-menu-store";
import { useQuery } from "@tanstack/react-query";
import { FC, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

type Props = {
    prefix?: string;
};

type FeedReturnObject = {
    title: string;
    imageUrl: string;
    internalIdentifier: string;
    totalItemsCount: number;
    totalItemsUnreadCount: number;
    bookmarkedItemsUnreadCount: number;
    favoriteItemsUnreadCount: number;
};

export const SideMenuContainer: FC<Props> = ({ prefix }) => {
    const api = useAuthFetcher();
    const isMenuOpen = useMenuStore(state => state.isOpen);
    const setIsOpen = useMenuStore(state => state.setIsOpen);

    const closeMenu = () => {
        setIsOpen(false);
    };

    const { data } = useQuery<FeedReturnObject[]>({
        queryKey: ["items", "feed", "all"],
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
            return acc + feed.totalItemsUnreadCount;
        }, 0);
    }, [data]);

    const bookmarksUnread = useMemo(() => {
        // eslint-disable-next-line unicorn/no-array-reduce
        return data.reduce((acc, feed) => {
            return acc + feed.bookmarkedItemsUnreadCount;
        }, 0);
    }, [data]);

    const favoritesUnread = useMemo(() => {
        // eslint-disable-next-line unicorn/no-array-reduce
        return data.reduce((acc, feed) => {
            return acc + feed.favoriteItemsUnreadCount;
        }, 0);
    }, [data]);

    useEffect(() => {
        const currentTitle = document.title.replace(/\([0-9]+\)/, "");

        if (totalUnread > 0) {
            document.title = `(${totalUnread}) ${currentTitle}`;
        } else {
            document.title = currentTitle;
        }
    }, [totalUnread]);

    return (
        <SideMenu
            isOpen={isMenuOpen}
            closeButton={
                <ResponsiveIcon
                    Icon={Icons.close}
                    size="sm"
                    onClick={closeMenu}
                    className="absolute top-0 right-0 mr-4 mt-5 md:hidden"
                />
            }
        >
            <Category title="Menu">
                <SubMenu>
                    {/* <Item
                        title="Home"
                        url={prefixUrl("")}
                        Icon={Icons.home}
                        selected={isSelected("")}
                        highlight={Boolean(totalUnread)}
                        notification={totalUnread > 0 ? totalUnread : undefined}
                        notificationTooltip="Unread items"
                        onClick={closeMenu}
                    /> */}
                    <Item
                        title="All"
                        url={prefixUrl("/all")}
                        Icon={Icons.layout}
                        selected={isSelected("/all")}
                        highlight={Boolean(totalUnread)}
                        notification={totalUnread > 0 ? totalUnread : undefined}
                        notificationTooltip="Unread items"
                        onClick={closeMenu}
                    />
                    <Item
                        title="Read later"
                        url={prefixUrl("/bookmarks")}
                        Icon={Icons.bookmark}
                        selected={isSelected("/bookmarks")}
                        highlight={Boolean(bookmarksUnread)}
                        notification={bookmarksUnread > 0 ? bookmarksUnread : undefined}
                        notificationTooltip="Unread items"
                        onClick={closeMenu}
                    />
                    <Item
                        title="Favorites"
                        url={prefixUrl("/favorites")}
                        Icon={Icons.star}
                        selected={isSelected("/favorites")}
                        highlight={Boolean(favoritesUnread)}
                        notification={favoritesUnread > 0 ? favoritesUnread : undefined}
                        notificationTooltip="Unread items"
                        onClick={closeMenu}
                    />
                </SubMenu>
            </Category>

            <Divider size="lg" />

            <Category title="Feeds">
                <SubMenu>
                    {data.map(feed => {
                        const unread = feed.totalItemsUnreadCount;

                        return (
                            <Item
                                key={feed.internalIdentifier}
                                title={feed.title}
                                url={prefixUrl(`/feed/${feed.internalIdentifier}`)}
                                image={feed.imageUrl}
                                backupImage={avatarUrl(feed.internalIdentifier)}
                                selected={isSelected(`/feed/${feed.internalIdentifier}`)}
                                notification={unread > 0 ? unread : undefined}
                                highlight={Boolean(unread)}
                                notificationTooltip="Unread items"
                                onClick={closeMenu}
                            />
                        );
                    })}
                </SubMenu>
            </Category>
        </SideMenu>
    );
};
