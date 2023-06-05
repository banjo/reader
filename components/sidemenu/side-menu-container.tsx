import { Icons } from "@/components/icons";
import { Category } from "@/components/sidemenu/category";
import { Divider } from "@/components/sidemenu/divider";
import { Item } from "@/components/sidemenu/item";
import { Sidemenu } from "@/components/sidemenu/menu";
import { SubMenu } from "@/components/sidemenu/sub-menu";
import { FC } from "react";

type Props = {
    test?: boolean;
};

export const SideMenuContainer: FC<Props> = ({ test }) => {
    console.log(test);
    return (
        <Sidemenu>
            <Divider size="md" />
            <Category title="Menu" />
            <SubMenu>
                <Item
                    title="Home"
                    Icon={Icons.home}
                    selected={true}
                    highlight={true}
                    notification={4}
                />
                <Item title="Bookmarks" Icon={Icons.bookmark} selected={false} />
            </SubMenu>

            <Divider size="lg" />
            <Category title="Feeds" />
            <SubMenu>
                <Item title="All" Icon={Icons.layout} selected={false} />
            </SubMenu>
        </Sidemenu>
    );
};
