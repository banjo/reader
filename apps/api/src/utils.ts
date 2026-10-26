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

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 100;

const parsePositiveInt = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isNaN(parsed) ? fallback : Math.max(parsed, 1);
};

export const parsePagination = (context: Context): Pagination => {
    const queryParams = context.req.query();

    return {
        page: parsePositiveInt(queryParams.page, 1),
        pageSize: Math.min(
            parsePositiveInt(queryParams.pageSize, DEFAULT_PAGE_SIZE),
            MAX_PAGE_SIZE
        ),
    };
};
