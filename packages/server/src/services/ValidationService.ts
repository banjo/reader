import { KeySchema, ZodIssue } from "zod";
import { Result } from "../shared/models/result";

const createErrorMessage = (issues: ZodIssue[], value: string, name: string): string => {
    const firstError = issues[0];
    const message = `Issues with (${name}) with value (${value}): ${firstError.message}`;
    return message;
};

const validateKey = (name: string, value: string, schema: KeySchema) => {
    const result = schema.safeParse(value);
    if (!result.success) {
        const errorMessage = createErrorMessage(result.error.issues, value, name);
        return Result.error(errorMessage, "BadRequest");
    }
    return Result.ok(result.data);
};

export const ValidationService = { validateKey };
