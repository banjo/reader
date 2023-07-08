import { NextResponse } from "next/server";
import {
    BadRequestError,
    RequestError,
    SuccessRequest,
} from "@/shared/models/request";
import { ZodIssue } from "zod";

import { ErrorStatus, ErrorType } from "../../shared/models/result";

const success = <T>(data: T): NextResponse<SuccessRequest<T>> => {
    return NextResponse.json({ data, success: true });
};

const emptySuccess = (): NextResponse<SuccessRequest<null>> => {
    return NextResponse.json({ data: null, success: true });
};

const error = (
    message: string,
    type: ErrorType,
): NextResponse<RequestError> => {
    return NextResponse.json(
        {
            error: {
                message,
                code: ErrorStatus[type],
            },
        },
        { status: ErrorStatus[type], statusText: type },
    );
};

const badRequest = (
    name: string,
    errors: ZodIssue[],
): NextResponse<BadRequestError> => {
    return NextResponse.json(
        {
            error: {
                message: `Bad request with ${name}, something went wrong.`,
                code: 400,
                errors,
            },
        },
        { status: 400, statusText: "BadRequest" },
    );
};

export const ResponseService = { success, error, badRequest, emptySuccess };
