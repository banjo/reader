import { raise } from "@banjoanton/utils";
import ky from "ky";
import { Result } from "utils";

const PROD_URL = process.env.WORKER_PROD_URL ?? raise("Missing WORKER_PROD_URL");
const AUTH_TOKEN = process.env.AUTH_TOKEN ?? raise("Missing AUTH_TOKEN");
const url = process.env.NODE_ENV === "production" ? PROD_URL : "http://localhost:3000";

const api = ky.create({
    prefixUrl: `${url}/api`,
    headers: {
        "auth-token": AUTH_TOKEN,
        "Content-Type": "application/json",
    },
});

export const addRepeatableJob = async (feedId: number) => {
    try {
        console.log(`Adding to URL: ${url}`);
        // await api.get(`repeatable?feedId=${feedId}`, {}).json<ResultType<void>>();
        await fetch(`${url}/api/repeatable?feedId=${feedId}`, {
            headers: {
                "auth-token": AUTH_TOKEN,
            },
        });
        return Result.okEmpty();
    } catch (error: unknown) {
        console.log("Could not add repeatable job");
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
