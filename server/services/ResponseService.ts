import { NextResponse } from "next/server";
import { ZodIssue } from "zod";
import { ErrorStatus, ErrorType } from "../../models/result";

const success = <T>(data: T) => {
    return NextResponse.json({ data, success: true });
};

const error = (message: string, type: ErrorType) => {
    return NextResponse.json(
        {
            error: {
                message,
            },
        },
        { status: ErrorStatus[type], statusText: type }
    );
};

const badRequest = (name: string, errors: ZodIssue[]) => {
    return NextResponse.json(
        {
            error: {
                message: `Bad request with ${name}, something went wrong.`,
                errors,
            },
        },
        { status: 400, statusText: "BadRequest" }
    );
};

export const ResponseService = { success, error, badRequest };
