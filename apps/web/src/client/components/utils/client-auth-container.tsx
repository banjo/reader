"use client";

import { useAuth } from "@/client/hooks/backend/use-auth";
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
