"use client";

import { FC, ReactNode } from "react";
import { useAuth } from "@/client/hooks/backend/use-auth";

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
