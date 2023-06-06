import { ErrorType, Result, SuccessResult } from "@/models/result";
import { getUrl } from "@/shared/lib/url";
import { auth } from "@clerk/nextjs";
import ky, { HTTPError } from "ky-universal";

/**
 * HELPERS
 */

const handleError = async <T>(error: unknown): Promise<Result<T>> => {
    const errorTyped = error as HTTPError;
    const errorMessage = await errorTyped.response.text();
    const type = errorTyped.response.statusText as ErrorType; // TODO: validate this later

    return Result.error(errorMessage, type);
};

const api = ky.create({
    prefixUrl: `${getUrl()}/api`,
    hooks: {
        beforeRequest: [
            options => {
                const { userId } = auth();

                if (!userId) {
                    throw new Error("User is not authenticated");
                }

                options.headers.set("X-External-User-Id", userId);
                options.headers.set("Content-Type", "application/json");
            },
        ],
    },
});

/**
 * FETCHER
 **/

const GET = async <T>(path: string): Promise<Result<T>> => {
    try {
        const res = await api.get(path).json<SuccessResult<T>>();

        return Result.ok(res.data);
    } catch (error: unknown) {
        console.log(error);
        return handleError(error);
    }
};

const POST = async <T>(path: string, body: unknown): Promise<Result<T>> => {
    try {
        const res = await api.post(path, { json: body }).json<SuccessResult<T>>();

        return Result.ok(res.data);
    } catch (error: unknown) {
        return handleError(error);
    }
};

const PUT = async <T>(path: string, body: unknown): Promise<Result<T>> => {
    try {
        const res = await api.put(path, { json: body }).json<SuccessResult<T>>();

        return Result.ok(res.data);
    } catch (error: unknown) {
        return handleError(error);
    }
};

const DELETE = async <T>(path: string): Promise<Result<T>> => {
    try {
        const res = await api.delete(path).json<SuccessResult<T>>();

        return Result.ok(res.data);
    } catch (error: unknown) {
        return handleError(error);
    }
};

export const fetcher = { GET, POST, PUT, DELETE };
