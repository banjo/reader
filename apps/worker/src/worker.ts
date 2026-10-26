import {
    addImageWorker,
    addToUsersWorker,
    fetchContentWithoutImageWorker,
    fetchRssFeedWorker,
    importFeedsWorker,
} from "server";
import { addFetchRss } from "./add";

export const start = async () => {
    console.info("Workers started...");
    fetchRssFeedWorker().start();
    addToUsersWorker().start();
    fetchContentWithoutImageWorker().start();
    addImageWorker().start();
    importFeedsWorker().start();

    await fetchRssFeedWorker().stopRepeatable();
    await addToUsersWorker().stopRepeatable();
    await fetchContentWithoutImageWorker().stopRepeatable();

    await fetchContentWithoutImageWorker().repeatable({});

    await addFetchRss();
};
