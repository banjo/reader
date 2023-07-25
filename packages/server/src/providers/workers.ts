import { raise } from "@banjoanton/utils";
import ky from "ky";
import { Result, ResultType } from "utils";

const PROD_URL = process.env.WORKER_PROD_URL ?? raise("Missing WORKER_PROD_URL");
const url = process.env.NODE_ENV === "production" ? PROD_URL : "http://localhost:3000";

const api = ky.create({
    prefixUrl: `${url}/api`,
    hooks: {
        beforeRequest: [
            options => {
                options.headers.set("auth-token", process.env.AUTH_TOKEN ?? "");
                options.headers.set("Content-Type", "application/json");
            },
        ],
    },
});

export const addRepeatableJob = async (feedId: number) => {
    try {
        await api.get(`repeatable?feedId=${feedId}`).json<ResultType<void>>();
        return Result.okEmpty();
    } catch (error: unknown) {
        let errorMessage = "Internal Server Error";
        if (error instanceof Error) {
            console.log(error.message);
            errorMessage = error.message;
        } else if (typeof error === "string") {
            console.log(error);
            errorMessage = error;
        }

        return Result.error(errorMessage, "InternalError");
    }
};
