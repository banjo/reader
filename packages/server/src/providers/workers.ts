import { raise } from "@banjoanton/utils";
import {} from "model"; // typescript error
import { createLogger, Result } from "utils";

const getVariables = () => {
    const PROD_URL = process.env.WORKER_PROD_URL ?? raise("Missing WORKER_PROD_URL");
    const AUTH_TOKEN = process.env.AUTH_TOKEN ?? raise("Missing AUTH_TOKEN");
    const url = process.env.NODE_ENV === "production" ? PROD_URL : "http://localhost:3001";

    return { url, AUTH_TOKEN };
};

const logger = createLogger("WorkerProvider");

export const addRepeatableJob = async (feedId: number) => {
    const { url, AUTH_TOKEN } = getVariables();
    try {
        const fullUrl = `${url}/api/repeatable?feedId=${feedId}`;
        await fetch(fullUrl, {
            headers: {
                "auth-token": AUTH_TOKEN,
            },
        });
        return Result.okEmpty();
    } catch (error: unknown) {
        logger.error(`Could not add repeatable job: ${error}`);
        let errorMessage = "Internal Server Error";
        if (error instanceof Error) {
            logger.error(error.message);
            errorMessage = error.message;
        } else if (typeof error === "string") {
            console.error(error);
            errorMessage = error;
        }

        return Result.error(errorMessage, "InternalError");
    }
};
