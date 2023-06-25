import { CleanItem, CreateItem, UpdateItem } from "@/shared/models/entities";

export const cleanItemToUpdateItem = (item: CleanItem): UpdateItem => {
    return {
        id: item.id,
        isRead: item.isRead,
        isBookmarked: item.isBookmarked,
        isFavorite: item.isFavorite,
    };
};

export const defaultItem: () => Omit<CreateItem, "userId"> = () => {
    return {
        isRead: false,
        isBookmarked: false,
        isFavorite: false,
    };
};

export const ItemMapper = {
    cleanItemToUpdateItem,
    defaultItem,
};
