import { useMemo, useState } from "react";

export type InitialFilter = {
    isRead?: boolean;
    isBookmarked?: boolean;
    isFavorite?: boolean;
};

export type Filter = {
    toggleIsRead: () => void;
    isRead: () => boolean;
};

export const useFilters = (initialFilter?: InitialFilter) => {
    const [isRead, setIsRead] = useState(() => {
        if (initialFilter?.isRead !== undefined) {
            return initialFilter.isRead;
        }

        return true;
    });

    const [isBookmarked, setIsBookmarked] = useState(() => {
        if (initialFilter?.isBookmarked !== undefined) {
            return initialFilter.isBookmarked;
        }

        return false;
    });

    const [isFavorite, setIsFavorite] = useState(() => {
        if (initialFilter?.isFavorite !== undefined) {
            return initialFilter.isFavorite;
        }

        return false;
    });

    const paramString = useMemo(() => {
        const params = new URLSearchParams();

        // show all items if isRead is undefined
        if (!isRead) {
            params.append("isRead", isRead.toString());
        }

        if (isBookmarked) {
            params.append("isBookmarked", isBookmarked.toString());
        }

        if (isFavorite) {
            params.append("isFavorite", isFavorite.toString());
        }

        return params.toString();
    }, [isRead, isBookmarked, isFavorite]);

    const keys = useMemo(
        () => [isRead, isBookmarked, isFavorite] as const,
        [isRead, isBookmarked, isFavorite]
    );

    const filter: Filter = useMemo(() => {
        return {
            isRead: () => isRead,
            toggleIsRead: () => setIsRead(prev => !prev),
        };
    }, [isRead]);

    return { paramString, filter, isRead, keys };
};
