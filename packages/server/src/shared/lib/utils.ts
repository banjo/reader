import { ItemWithContent, Prisma } from "db";
import { Filter, Pagination } from "model";

export function sortItems<T extends ItemWithContent>(items: T[]): T[] {
    return [
        ...items.sort((a, b) => {
            if (a.content.pubDate && b.content.pubDate) {
                return b.content.pubDate.getTime() - a.content.pubDate.getTime();
            }
            return 0;
        }),
    ];
}

export const getFilterWhere = (filter?: Filter): Prisma.ItemWhereInput => {
    return {
        isRead: filter?.isRead === undefined ? undefined : filter.isRead,
        isBookmarked: filter?.isBookmarked === undefined ? undefined : filter.isBookmarked,
        isFavorite: filter?.isFavorite === undefined ? undefined : filter.isFavorite,
    };
};

export const getPagination = (pagination?: Pagination) => {
    return {
        take: pagination ? pagination.pageSize : undefined,
        skip: pagination ? (pagination.page - 1) * pagination.pageSize : undefined,
    };
};
