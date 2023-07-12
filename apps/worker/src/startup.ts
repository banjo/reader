import { fetchWorker } from "@/workers/fetch/fetch-worker";

export const start = async () => {
    await fetchWorker.start();
};
