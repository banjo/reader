import { getUrl } from "@/shared/lib/url";
import ky, { HTTPError } from "ky-universal";
import {
    AsyncResultType,
    BadRequestError,
    ErrorType,
    RequestError,
    Result,
    SuccessRequest,
} from "utils";

/**
 * HELPERS
 */

const isBadRequestError = (body: any): body is BadRequestError => {
    return body?.error?.errors;
};

const isRequestError = (body: any): body is RequestError => {
    return body?.error?.message;
};

const handleError = async <T>(error: any): AsyncResultType<T> => {
    if (error?.message?.includes("prefixUrl")) {
        console.error("You cannot prefix URLs with '/' when using fetcher");
        return Result.error("You cannot prefix URLs with '/' when using fetcher", "InternalError");
    }

    const errorTyped = error as HTTPError;
    const body = await errorTyped.response.json();

    if (isBadRequestError(body)) {
        return Result.error(body.error.message, "BadRequest");
    } else if (isRequestError(body)) {
        return Result.error(body.error.message, "InternalError");
    }

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

    const SWR_AUTH = async <T>(path: string): Promise<T> => {
        try {
            const res = await api.get(updatePath(path)).json<SuccessRequest<T>>();
            return res.data;
        } catch (error: unknown) {
            console.log(error);
            throw error;
        }
    };

    const SWR = <T>(
        path: string,
        method: "GET" | "POST" | "PUT" | "DELETE",
        body?: T
    ): (() => Promise<undefined>) => {
        return () =>
            api(updatePath(path), {
                method,
                body: JSON.stringify(body),
            }).json();
    };

    const GET = async <T>(path: string): AsyncResultType<T> => {
        try {
            const res = await api.get(updatePath(path)).json<SuccessRequest<T>>();

            return Result.ok(res.data);
        } catch (error: unknown) {
            console.log(error);
            return handleError(error);
        }
    };

    const POST = async <T>(path: string, body: unknown): AsyncResultType<T> => {
        try {
            const res = await api.post(updatePath(path), { json: body }).json<SuccessRequest<T>>();

            return Result.ok(res.data);
        } catch (error: unknown) {
            return handleError(error);
        }
    };

    const PUT = async <T>(path: string, body: unknown): AsyncResultType<T> => {
        try {
            const res = await api.put(updatePath(path), { json: body }).json<SuccessRequest<T>>();

            return Result.ok(res.data);
        } catch (error: unknown) {
            return handleError(error);
        }
    };

    const DELETE = async <T>(path: string): AsyncResultType<T> => {
        try {
            const res = await api.delete(updatePath(path)).json<SuccessRequest<T>>();

            return Result.ok(res.data);
        } catch (error: unknown) {
            return handleError(error);
        }
    };

    return { GET, POST, PUT, DELETE, SWR, SWR_AUTH };
};
