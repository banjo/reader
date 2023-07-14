import { start } from "@/startup";
import { addToUsersWorker } from "@/workers/add-to-users/add-to-users-worker";
import { fetchWorker } from "@/workers/fetch/fetch-worker";

process.on("SIGTERM", async () => {
    console.info("SIGTERM signal received: closing queues");

    await fetchWorker.close();
    await addToUsersWorker.close();

    console.info("All closed");
});

start();
