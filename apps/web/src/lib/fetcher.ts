import { Result } from "@/lib/result";
import { jsonDateParser } from "json-date-parser";
import { AsyncResultType, SuccessRequest } from "model";
import { ofetch } from "ofetch";

/**
 * HELPERS
 */

const handleError = async <T>(error: any): AsyncResultType<T> => {
    if (error instanceof Error) {
        return Result.error(error.message, "InternalError");
    } else if (typeof error === "string") {
        return Result.error(error, "InternalError");
    }

    return Result.error("Something went wrong", "InternalError");
};

/**
 * FETCHER
 **/

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3003";

export const fetcher = (userId: string) => {
    const api = ofetch.create({
        baseURL: `${API_URL}/api`,
        headers: {
            "X-External-User-Id": userId,
            "Content-Type": "application/json",
        },
        parseResponse: async res => JSON.parse(res, jsonDateParser),
    });

    type options = {
        method: "GET" | "POST" | "PUT" | "DELETE";
        body?: any;
    };

    const defaultOptions: options = {
        method: "GET",
    };

    const QUERY = async <T>(path: string, options?: options): Promise<T> => {
        const { method = "GET", body } = { ...defaultOptions, ...options };
        try {
            const res = await api<SuccessRequest<T>>(path, {
                method,
                body,
            });

            return res.data;
        } catch (error: unknown) {
            console.log(error);
            throw error;
        }
    };

    const GET = async <T>(path: string): AsyncResultType<T> => {
        try {
            const res = await api<SuccessRequest<T>>(path, {
                method: "GET",
            });

            return Result.ok(res.data);
        } catch (error: unknown) {
            console.log(error);
            return handleError(error);
        }
    };

    const POST = async <T>(path: string, body: Record<string, any>): AsyncResultType<T> => {
        try {
            const res = await api<SuccessRequest<T>>(path, {
                method: "POST",
                body,
            });
            return Result.ok(res.data);
        } catch (error: unknown) {
            return handleError(error);
        }
    };

    const PUT = async <T>(path: string, body: Record<string, any>): AsyncResultType<T> => {
        try {
            const res = await api<SuccessRequest<T>>(path, {
                method: "PUT",
                body,
            });

            return Result.ok(res.data);
        } catch (error: unknown) {
            return handleError(error);
        }
    };

    const DELETE = async <T>(path: string): AsyncResultType<T> => {
        try {
            const res = await api<SuccessRequest<T>>(path, {
                method: "DELETE",
            });

            return Result.ok(res.data);
        } catch (error: unknown) {
            return handleError(error);
        }
    };

    return { GET, POST, PUT, DELETE, QUERY };
};
