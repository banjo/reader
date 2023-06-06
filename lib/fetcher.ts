import { ErrorType, Result, ResultType, SuccessResult } from "@/models/result";
import { getUrl } from "@/shared/lib/url";
import ky, { HTTPError } from "ky-universal";
// import "server-only";

/**
 * HELPERS
 */

const handleError = async <T>(error: any): Promise<ResultType<T>> => {
    if (error?.message?.includes("prefixUrl")) {
        console.error("You cannot prefix URLs with '/' when using fetcher");
        return Result.error("You cannot prefix URLs with '/' when using fetcher", "InternalError");
    }

    const errorTyped = error as HTTPError;
    const errorMessage = await errorTyped.response.text();
    const type = errorTyped.response.statusText as ErrorType; // TODO: validate this later

    return Result.error(errorMessage, type);
};

/**
 * Removes the leading '/' from the URL, which is not possible to use with  ky
 * @param path - The path to fix
 * @returns
 */
const updatePath = (url: string): string => {
    if (url.startsWith("/")) {
        return url.slice(1);
    }

    return url;
};

/**
 * FETCHER
 **/

export const fetcher = (userId: string) => {
    const api = ky.create({
        prefixUrl: `${getUrl()}/api`,
        hooks: {
            beforeRequest: [
                options => {
                    if (!userId) {
                        throw new Error("User is not authenticated");
                    }

                    options.headers.set("X-External-User-Id", userId);
                    options.headers.set("Content-Type", "application/json");
                },
            ],
        },
    });

    const GET = async <T>(path: string): Promise<ResultType<T>> => {
        try {
            const res = await api.get(updatePath(path)).json<SuccessResult<T>>();

            return Result.ok(res.data);
        } catch (error: unknown) {
            console.log(error);
            return handleError(error);
        }
    };

    const POST = async <T>(path: string, body: unknown): Promise<ResultType<T>> => {
        try {
            const res = await api.post(updatePath(path), { json: body }).json<SuccessResult<T>>();

            return Result.ok(res.data);
        } catch (error: unknown) {
            return handleError(error);
        }
    };

    const PUT = async <T>(path: string, body: unknown): Promise<ResultType<T>> => {
        try {
            const res = await api.put(updatePath(path), { json: body }).json<SuccessResult<T>>();

            return Result.ok(res.data);
        } catch (error: unknown) {
            return handleError(error);
        }
    };

    const DELETE = async <T>(path: string): Promise<ResultType<T>> => {
        try {
            const res = await api.delete(updatePath(path)).json<SuccessResult<T>>();

            return Result.ok(res.data);
        } catch (error: unknown) {
            return handleError(error);
        }
    };

    return { GET, POST, PUT, DELETE };
};
