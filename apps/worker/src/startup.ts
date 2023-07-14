import { addToUsersWorker } from "@/workers/add-to-users/add-to-users-worker";
import { fetchWorker } from "@/workers/fetch/fetch-worker";

export const start = async () => {
    await fetchWorker.start();
    await addToUsersWorker.start();
};
