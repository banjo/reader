import { addImageWorker, addToUsersWorker, fetchWorker, imageWorker } from "server";
import { addFetchRss } from "./add";

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
