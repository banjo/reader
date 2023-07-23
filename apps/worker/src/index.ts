import { addFetchRss } from "@/add";
import { addToUsersWorker, fetchWorker } from "server";

process.on("SIGTERM", async () => {
    console.info("SIGTERM signal received: closing queues");

    await fetchWorker.close();
    await addToUsersWorker.close();

    console.info("All closed");
});

export const start = async () => {
    console.info("Workers started...");
    await fetchWorker.start();
    await addToUsersWorker.start();

    await fetchWorker.stopRepeatable();
    await addToUsersWorker.stopRepeatable();

    await addFetchRss();
};

start();
