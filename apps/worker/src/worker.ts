import {
    addImageWorker,
    addToUsersWorker,
    fetchContentWithoutImageWorker,
    fetchRssFeedWorker,
    importFeedsWorker,
    refreshArticlesWorker,
    verifyImagesWorker,
} from "server";
import { addFetchRss } from "./add";

export const start = async () => {
    console.info("Workers started...");
    fetchRssFeedWorker().start();
    addToUsersWorker().start();
    fetchContentWithoutImageWorker().start();
    addImageWorker().start();
    importFeedsWorker().start();
    refreshArticlesWorker().start();
    verifyImagesWorker().start();

    await fetchRssFeedWorker().stopRepeatable();
    await addToUsersWorker().stopRepeatable();
    await fetchContentWithoutImageWorker().stopRepeatable();
    await refreshArticlesWorker().stopRepeatable();
    await verifyImagesWorker().stopRepeatable();

    await fetchContentWithoutImageWorker().repeatable({});
    await refreshArticlesWorker().repeatable({}, 24 * 60 * 60 * 1000);
    await verifyImagesWorker().repeatable({}, 24 * 60 * 60 * 1000);

    await addFetchRss();
};
