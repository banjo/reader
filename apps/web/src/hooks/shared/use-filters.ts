import { useMemo, useState } from "react";

export type Filter = {
    toggleIsRead: () => void;
    isRead: () => boolean;
};

export const useFilters = () => {
    const [isRead, setIsRead] = useState(false);

    const paramString = useMemo(() => {
        const params = new URLSearchParams();

        // show all items if isRead is undefined
        if (!isRead) {
            params.append("isRead", isRead.toString());
        }

        return params.toString();
    }, [isRead]);

    const filter: Filter = useMemo(() => {
        return {
            isRead: () => isRead,
            toggleIsRead: () => setIsRead(prev => !prev),
        };
    }, [isRead]);

    return { paramString, filter, isRead };
};
