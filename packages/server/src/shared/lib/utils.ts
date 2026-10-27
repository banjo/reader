import { Prisma } from "db";
import { Filter, normalizeArticleSearch, Pagination } from "model";

// Publish dates are not unique, so `id` keeps the order stable between pages.
export const itemOrderBy = [
    { content: { pubDate: "desc" } },
    { id: "desc" },
] satisfies Prisma.ItemOrderByWithRelationInput[];

export const contentOrderBy = [
    { pubDate: "desc" },
    { id: "desc" },
] satisfies Prisma.ItemContentOrderByWithRelationInput[];

const articleSearchFilter = (search: string): Prisma.ItemContentWhereInput => ({
    OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
    ],
});

/** Case-insensitive match against article title, description, or body. */
export const getContentSearchWhere = (
    search?: string
): Prisma.ItemContentWhereInput | undefined => {
    const query = normalizeArticleSearch(search);
    if (!query) {
        return undefined;
    }

    return articleSearchFilter(query);
};

export const getFilterWhere = (filter?: Filter): Prisma.ItemWhereInput => {
    const content = getContentSearchWhere(filter?.search);

    return {
        isRead: filter?.isRead === undefined ? undefined : filter.isRead,
        isBookmarked: filter?.isBookmarked === undefined ? undefined : filter.isBookmarked,
        isFavorite: filter?.isFavorite === undefined ? undefined : filter.isFavorite,
        ...(content ? { content } : {}),
    };
};

export const getPagination = (pagination?: Pagination) => {
    return {
        take: pagination ? pagination.pageSize : undefined,
        skip: pagination ? (pagination.page - 1) * pagination.pageSize : undefined,
    };
};
