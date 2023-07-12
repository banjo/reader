import * as z from "zod";
import { Result, ResultType } from "../models/result";

type Error = {
    code: string;
    message: string;
};

const createErrorMessage = (issue: z.ZodIssue): Error => {
    return {
        code: issue.code,
        message: `Error with ${issue.path.join(".")}: ${issue.message}`,
    };
};

const createErrorMessages = (issues: z.ZodIssue[]): Error => {
    const firstError = issues[0];
    const message = `Issues with ${issues.length} field(s), first issue (${
        createErrorMessage(firstError).message
    })`;

    return {
        code: firstError.code,
        message,
    };
};

export const safeParseArray = <T>(array: T[], model: z.ZodSchema<T>): ResultType<T[]> => {
    try {
        const res = array.map(element => model.parse(element));
        return Result.ok(res);
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return Result.error(createErrorMessages(error.issues).message, "BadRequest");
        }
        return Result.error("Unknown error", "InternalError");
    }
};

export const safeParse = <T>(object: T, model: z.ZodSchema<T>): ResultType<T> => {
    try {
        const res = model.parse(object);
        return Result.ok(res);
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return Result.error(createErrorMessages(error.issues).message, "BadRequest");
        }
        return Result.error("Unknown error", "InternalError");
    }
};
