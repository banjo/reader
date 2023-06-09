"use client";

import { SideMenuContainer } from "@/client/components/nav/sidemenu/side-menu-container";
import { CleanFeedWithItems } from "@/shared/models/entities";
import { useAuth } from "@clerk/nextjs";
import { FC } from "react";

type Props = {
    prefix?: string;
    feeds: CleanFeedWithItems[];
};

/**
 * Side menu container for client side, fixing bug with Clerk logout.
 * The menu should not be rendered if the user is not logged in.
 */
export const SideMenuClientContainer: FC<Props> = ({ prefix, feeds }) => {
    const { userId } = useAuth();

    if (!userId) {
        return null;
    }

    return <SideMenuContainer feeds={feeds} prefix={prefix} />;
};
