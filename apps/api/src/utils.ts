import { Context } from "hono";
import { Filter, filterSchema, Pagination } from "model";

export const isDev = () =>
    process.env.NODE_ENV === "development" && process.env.LOCAL_DEVELOPMENT === "true";

const parseOptionalBoolean = (value: string | undefined) => (value ? value === "true" : undefined);

export const parseFilters = (context: Context): Filter => {
    const queryParams = context.req.query();
    const parsed = filterSchema.safeParse({
        isRead: parseOptionalBoolean(queryParams.isRead),
        isBookmarked: parseOptionalBoolean(queryParams.isBookmarked),
        isFavorite: parseOptionalBoolean(queryParams.isFavorite),
        search: queryParams.search ?? queryParams.query,
    });

    if (!parsed.success) {
        return {
            isRead: parseOptionalBoolean(queryParams.isRead),
            isBookmarked: parseOptionalBoolean(queryParams.isBookmarked),
            isFavorite: parseOptionalBoolean(queryParams.isFavorite),
        };
    }

    return parsed.data;
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
