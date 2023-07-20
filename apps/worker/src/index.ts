import { addFetchRss } from "@/add";
import { addToUsersWorker } from "@/workers/add-to-users/add-to-users-worker";
import { fetchWorker } from "@/workers/fetch/fetch-worker";

process.on("SIGTERM", async () => {
    console.info("SIGTERM signal received: closing queues");

    await fetchWorker.close();
    await addToUsersWorker.close();

    console.info("All closed");
});

export const start = async () => {
    await fetchWorker.start();
    await addToUsersWorker.start();

    await fetchWorker.stopRepeatable();
    await addToUsersWorker.stopRepeatable();

    await addFetchRss();
    const a = await fetchWorker.activeCount();
};

start();
