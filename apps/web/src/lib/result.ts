import { ErrorStatus, ErrorType, ResultType } from "model";

// copy of utils repo to now include that in the web app
export const Result = {
    ok: <T>(data: T): ResultType<T> => ({
        success: true,
        data,
    }),
    okEmpty: (): ResultType<void> => ({
        success: true,
        data: undefined,
    }),
    error: <T>(message: string, type: ErrorType): ResultType<T> => ({
        success: false,
        type,
        message,
        status: ErrorStatus[type],
    }),
};
