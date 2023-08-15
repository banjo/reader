import {
    addImageWorker,
    addToUsersWorker,
    fetchContentWithoutImageWorker,
    fetchRssFeedWorker,
} from "server";
import { addFetchRss } from "./add";

export const start = async () => {
    console.info("Workers started...");
    await fetchRssFeedWorker.start();
    await addToUsersWorker.start();
    await fetchContentWithoutImageWorker.start();
    await addImageWorker.start();

    await fetchRssFeedWorker.stopRepeatable();
    await addToUsersWorker.stopRepeatable();
    await fetchContentWithoutImageWorker.stopRepeatable();

    await fetchContentWithoutImageWorker.repeatable({});

    await addFetchRss();
};
