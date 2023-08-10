import { ZodIssue } from "zod";

export type RequestError = {
    error: {
        code: number;
        message: string;
    };
};

export type BadRequestError = {
    error: {
        errors: ZodIssue[];
    };
} & RequestError;

export type SuccessRequest<T> = {
    data: T;
    success: true;
};
