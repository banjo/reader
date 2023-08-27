import { Context } from "hono";
import { Filter, Pagination } from "model";

export const isDev = () =>
    process.env.NODE_ENV === "development" && process.env.LOCAL_DEVELOPMENT === "true";

export const parseFilters = (context: Context): Filter => {
    const queryParams = context.req.query();

    return {
        isRead: queryParams.isRead ? queryParams.isRead === "true" : undefined,
        isBookmarked: queryParams.isBookmarked ? queryParams.isBookmarked === "true" : undefined,
        isFavorite: queryParams.isFavorite ? queryParams.isFavorite === "true" : undefined,
    };
};

export const parsePagination = (context: Context): Pagination => {
    const queryParams = context.req.query();

    return {
        page: queryParams.page ? Number.parseInt(queryParams.page as string) : 1,
        pageSize: queryParams.pageSize ? Number.parseInt(queryParams.pageSize as string) : 12,
    };
};
