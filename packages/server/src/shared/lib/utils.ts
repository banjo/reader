import { Prisma } from "db";
import { Filter, Pagination } from "model";

// Publish dates are not unique, so `id` keeps the order stable between pages.
export const itemOrderBy = [
    { content: { pubDate: "desc" } },
    { id: "desc" },
] satisfies Prisma.ItemOrderByWithRelationInput[];

export const contentOrderBy = [
    { pubDate: "desc" },
    { id: "desc" },
] satisfies Prisma.ItemContentOrderByWithRelationInput[];

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
