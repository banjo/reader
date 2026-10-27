import { ZodIssue } from "zod";

export type ErrorType =
    "NotFound" | "BadRequest" | "Unauthorized" | "Forbidden" | "TooManyRequests" | "InternalError";

export const ErrorStatus = {
    NotFound: 404,
    BadRequest: 400,
    Unauthorized: 401,
    Forbidden: 403,
    TooManyRequests: 429,
    InternalError: 500,
} as const satisfies Record<ErrorType, number>;

export type ErrorStatusCode = (typeof ErrorStatus)[ErrorType];

export type SuccessResult<T> = {
    success: true;
    data: T;
};

export type ErrorResult = {
    success: false;
    type: ErrorType;
    message: string;
    status: ErrorStatusCode;
};

export type BadRequestResult = Omit<ErrorResult, "type"> & {
    type: "BadRequest";
    errors: ZodIssue[];
};

export type ResultType<T> = SuccessResult<T> | ErrorResult | BadRequestResult;

export type AsyncResultType<T> = Promise<ResultType<T>>;
