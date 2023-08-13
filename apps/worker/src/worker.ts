import { addImageWorker, addToUsersWorker, fetchWorker, imageWorker } from "worker-utils";
import { addFetchRss } from "./add";

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
    await imageWorker.start();
    await addImageWorker.start();

    await fetchWorker.stopRepeatable();
    await addToUsersWorker.stopRepeatable();
    await imageWorker.stopRepeatable();

    await imageWorker.repeatable({});

    await addFetchRss();
};
