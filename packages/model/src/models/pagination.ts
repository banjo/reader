import { z } from "zod";

export const paginationSchema = z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
});

export type Pagination = z.infer<typeof paginationSchema>;

export type PaginationResponse<T> = {
    data: T;
    pagination: {
        page: number;
        pageSize: number;
        total: number;
    };
};

export const PaginationResponse = {
    from: <T>(pagination: Pagination, total: number, data: T[]): PaginationResponse<T> => {
        return {
            pagination: {
                page: pagination.page,
                pageSize: pagination.pageSize,
                total,
            },
            data,
        };
    },
};
