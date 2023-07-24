import ky from "ky";
import { ResultType } from "utils";

const PROD_URL = process.env.WORKER_PROD_URL;
const url = process.env.NODE_ENV === "production" ? PROD_URL : "http://localhost:3000";

const api = ky.create({
    prefixUrl: `${url}/api`,
    hooks: {
        beforeRequest: [
            options => {
                // TODO: set simple auth
                options.headers.set("Content-Type", "application/json");
            },
        ],
    },
});

export const addRepeatableJob = async (feedId: number) => {
    try {
        await api.get(`repeatable?feedId=${feedId}`).json<ResultType<void>>();
    } catch (error: unknown) {
        console.log(error);
        throw error;
    }
};
