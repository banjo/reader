import { start } from "./startup";
import { fetchWorker } from "./workers/fetch/fetch-worker";

process.on("SIGTERM", async () => {
    console.info("SIGTERM signal received: closing queues");

    await fetchWorker.close();

    console.info("All closed");
});

start();

await fetchWorker.stopRepeatable();
