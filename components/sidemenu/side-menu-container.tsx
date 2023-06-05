"use client";

import { Icons } from "@/components/icons";
import { Category } from "@/components/sidemenu/category";
import { Divider } from "@/components/sidemenu/divider";
import { Item } from "@/components/sidemenu/item";
import { Sidemenu } from "@/components/sidemenu/menu";
import { SubMenu } from "@/components/sidemenu/sub-menu";
import { Feed } from "@prisma/client";
import { usePathname } from "next/navigation";
import { FC } from "react";

type Props = {
    prefix?: string;
    feeds: Feed[];
};

export const SideMenuContainer: FC<Props> = ({ prefix, feeds }) => {
    const pathname = usePathname();

    const prefixUrl = (url: string) => {
        return prefix ? `${prefix}${url}` : url;
    };

    const isSelected = (url: string) => {
        return pathname === prefixUrl(url);
    };

    return (
        <Sidemenu>
            <Divider size="md" />
            <Category title="Menu" />
            <SubMenu>
                <Item
                    title="Home"
                    url={prefixUrl("")}
                    Icon={Icons.home}
                    selected={isSelected("")}
                    highlight={true}
                    notification={4}
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
                {feeds.map(feed => (
                    <Item
                        key={feed.id}
                        title={feed.name}
                        url={prefixUrl(`/feed/${feed.id}`)}
                        Icon={Icons.moon}
                        selected={isSelected(`/feed/${feed.id}`)}
                    />
                ))}
            </SubMenu>
        </Sidemenu>
    );
};
