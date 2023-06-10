"use client";

import { useAuth } from "@clerk/nextjs";
import { FC, ReactNode } from "react";

type Props = {
    children: ReactNode;
};

export const ClientAuthContainer: FC<Props> = ({ children }) => {
    const { userId } = useAuth();

    if (!userId) {
        return null;
    }

    return <>{children}</>;
};
