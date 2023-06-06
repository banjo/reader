export type ErrorType = "NotFound" | "BadRequest" | "Unauthorized" | "Forbidden" | "InternalError";

export const ErrorStatus: Record<ErrorType, number> = {
    NotFound: 404,
    BadRequest: 400,
    Unauthorized: 401,
    Forbidden: 403,
    InternalError: 500,
};

export type SuccessResult<T> = {
    success: true;
    data: T;
};

export type ErrorResult = {
    success: false;
    type: ErrorType;
    message: string;
    status: number;
};

export type ResultType<T> = SuccessResult<T> | ErrorResult;

export const Result = {
    ok: <T>(data: T): ResultType<T> => ({
        success: true,
        data,
    }),
    error: <T>(message: string, type: ErrorType): ResultType<T> => ({
        success: false,
        type,
        message,
        status: ErrorStatus[type],
    }),
};
