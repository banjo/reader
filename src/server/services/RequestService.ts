import { Result, type ResultType } from "@/src/models/result";
import createLogger from "@/src/server/lib/logger";
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

const getSearchParams = (req: Request, param: string, schema: KeySchema): ResultType<string> => {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    const { searchParams } = new URL(req.url);
    const searchParam = searchParams.get(param);

    if (!searchParam) {
        logger.error(`Could not find ${param} in query params`);
        return Result.error(`Could not find ${param} in query params`, "BadRequest");
    }

    const parseResult = schema.safeParse(searchParam);

    if (!parseResult.success) {
        logger.error(`Could not parse ${param} in query params, wrong type`);
        return Result.error(`Could not parse ${param} in query params, wrong type`, "BadRequest");
    }

    return Result.ok(parseResult.data.toString());
};

export const RequestService = { getUserId, getSearchParams };
