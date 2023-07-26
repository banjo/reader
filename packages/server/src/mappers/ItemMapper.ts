const defaultItem = () => {
    return {
        isRead: false,
        isBookmarked: false,
        isFavorite: false,
    };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prepareSafeParse = (item: any) => {
    return {
        ...item,
        pubDate: item.pubDate ?? new Date().toISOString(),
    };
};

export const ItemMapper = {
    defaultItem,
    prepareSafeParse,
};
