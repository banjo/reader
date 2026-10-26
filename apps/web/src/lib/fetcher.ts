import { Result } from "@/lib/result";
import { jsonDateParser } from "json-date-parser";
import { AsyncResultType, ResultType, SuccessRequest } from "model";
import { ofetch } from "ofetch";

/**
 * HELPERS
 */

const defaultApiUrl = () => import.meta.env.VITE_API_URL ?? "http://localhost:3003";

const isUnauthorizedError = (error: unknown): boolean => {
    const typedError = error as { statusCode?: number; response?: { status?: number } } | undefined;

    const status = typedError?.statusCode ?? typedError?.response?.status;
    return status === 401;
};

const handleError = <T>(error: unknown): ResultType<T> => {
    if (isUnauthorizedError(error)) {
        return Result.error("Your session expired. Please sign in again.", "Unauthorized");
    }

    if (typeof error === "string") {
        return Result.error(error, "InternalError");
    }

    if (error instanceof Error) {
        return Result.error(error.message, "InternalError");
    }

    return Result.error("Something went wrong", "InternalError");
};

/**
 * FETCHER
 **/

type requestOptions = {
    method: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
};

type FetcherOptions = {
    token: string | undefined;
    refreshToken?: () => Promise<string | undefined>;
    baseURL?: string;
};

export const fetcher = ({ token, refreshToken, baseURL }: FetcherOptions) => {
    const apiUrl = `${baseURL ?? defaultApiUrl()}/api`;
    let currentToken = token;

    const send = async <T>(path: string, options: requestOptions): Promise<T> => {
        const res = await ofetch<SuccessRequest<T>>(path, {
            baseURL: apiUrl,
            method: options.method,
            body: options.body,
            headers: {
                Authorization: currentToken ? `Bearer ${currentToken}` : "",
                "Content-Type": "application/json",
            },
            // Error responses can be plain text, and parsing must not hide their status.
            parseResponse: text => {
                try {
                    return JSON.parse(text, jsonDateParser);
                } catch {
                    return text;
                }
            },
        });

        return res.data;
    };

    const request = async <T>(path: string, options: requestOptions): Promise<T> => {
        try {
            return await send<T>(path, options);
        } catch (error: unknown) {
            if (!isUnauthorizedError(error) || !refreshToken) {
                throw error;
            }

            // Retry exactly once. A second 401 propagates instead of refreshing again.
            const refreshedToken = await refreshToken();

            if (!refreshedToken) {
                throw error;
            }

            currentToken = refreshedToken;
            return await send<T>(path, options);
        }
    };

    const QUERY = <T>(path: string, options?: requestOptions): Promise<T> =>
        request<T>(path, { method: "GET", ...options });

    const GET = async <T>(path: string): AsyncResultType<T> => {
        try {
            return Result.ok(await request<T>(path, { method: "GET" }));
        } catch (error: unknown) {
            return handleError(error);
        }
    };

    const POST = async <T>(path: string, body: Record<string, any>): AsyncResultType<T> => {
        try {
            return Result.ok(await request<T>(path, { method: "POST", body }));
        } catch (error: unknown) {
            return handleError(error);
        }
    };

    const PUT = async <T>(path: string, body: Record<string, any>): AsyncResultType<T> => {
        try {
            return Result.ok(await request<T>(path, { method: "PUT", body }));
        } catch (error: unknown) {
            return handleError(error);
        }
    };

    const DELETE = async <T>(path: string): AsyncResultType<T> => {
        try {
            return Result.ok(await request<T>(path, { method: "DELETE" }));
        } catch (error: unknown) {
            return handleError(error);
        }
    };

    return { GET, POST, PUT, DELETE, QUERY };
};
