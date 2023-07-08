import createLogger from "@/server/lib/logger";
import { Result, type ResultType } from "@/shared/models/result";
import { KeySchema } from "zod";

const logger = createLogger("RequestService");

const getUserId = (req: Request): number => {
    const headers = new Headers(req.headers);
    const userId = headers.get("X-User-Id");

    if (!userId) {
        throw new Error("User is not authenticated");
    }

    return Number(userId);
};

const getQueryParams = (
    req: Request,
    name: string,
    schema: KeySchema,
): ResultType<string> => {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    const { searchParams } = new URL(req.url);
    const searchParam = searchParams.get(name);

    if (!searchParam) {
        logger.error(`Could not find ${name} in query params`);
        return Result.error(
            `Could not find ${name} in query params`,
            "BadRequest",
        );
    }

    const parseResult = schema.safeParse(searchParam);

    if (!parseResult.success) {
        logger.error(`Could not parse ${name} in query params, wrong type`);
        return Result.error(
            `Could not parse ${name} in query params, wrong type`,
            "BadRequest",
        );
    }

    return Result.ok(parseResult.data.toString());
};

export const RequestService = { getUserId, getQueryParams };
