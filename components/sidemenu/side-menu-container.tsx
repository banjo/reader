"use client";

import { Icons } from "@/components/icons";
import { Category } from "@/components/sidemenu/category";
import { Divider } from "@/components/sidemenu/divider";
import { Input } from "@/components/sidemenu/input";
import { Item } from "@/components/sidemenu/item";
import { Sidemenu } from "@/components/sidemenu/menu";
import { SubMenu } from "@/components/sidemenu/sub-menu";
import { avatarUrl } from "@/lib/utils";
import { CleanFeedWithItems } from "@/models/entities";
import { usePathname } from "next/navigation";
import { FC, useMemo } from "react";

type Props = {
    prefix?: string;
    feeds: CleanFeedWithItems[];
};

export const SideMenuContainer: FC<Props> = ({ prefix, feeds }) => {
    const pathname = usePathname();

    const prefixUrl = (url: string) => {
        return prefix ? `${prefix}${url}` : url;
    };

    const isSelected = (url: string) => {
        return pathname === prefixUrl(url);
    };

    const totalUnread = useMemo(() => {
        // eslint-disable-next-line unicorn/no-array-reduce
        return feeds.reduce((acc, feed) => {
            if (!feed.items) {
                return acc;
            }

            return acc + feed.items.filter(item => !item.hasRead).length;
        }, 0);
    }, [feeds]);

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
                    notification={totalUnread}
                />
                <Item
                    title="Bookmarks"
                    url={prefixUrl("/bookmarks")}
                    Icon={Icons.bookmark}
                    selected={isSelected("/bookmarks")}
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
                />
                {feeds.map(feed => {
                    const unread = feed.items?.filter(item => !item.hasRead).length || "";

                    return (
                        <Item
                            key={feed.id}
                            title={feed.name}
                            url={prefixUrl(`/feed/${feed.publicUrl}`)}
                            image={feed.imageUrl ?? avatarUrl(feed.publicUrl)}
                            selected={isSelected(`/feed/${feed.publicUrl}`)}
                            notification={unread}
                            highlight={Boolean(unread)}
                        />
                    );
                })}
            </SubMenu>
        </Sidemenu>
    );
};
