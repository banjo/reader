import { options } from "@/config";
import { WorkerType } from "@/types";
import { addToUsersWorker } from "@/workers/add-to-users/add-to-users-worker";
import { toMilliseconds } from "@banjoanton/utils";
import { Job, Queue, Worker } from "bullmq";
import { FeedWithContent } from "db";
import { createLogger, ItemRepository, ParseService, Result } from "server";

const logger = createLogger("FetchWorker");

type FetchJobData = {
    feed: FeedWithContent;
};

const QUEUE_NAME = "fetch";
const JOB_NAME = "fetch-job";
const fetchQueue = new Queue<FetchJobData>(QUEUE_NAME, options);

export const processor = async (job: Job<FetchJobData>) => {
    const { feed } = job.data;

    logger.info(`Fetching ${feed.rssUrl}`);

    const updatedContent = await ParseService.shouldParseAgain(feed.contentItems, feed.rssUrl);

    if (!updatedContent) {
        logger.info("no need to fetch again");
        return Result.okEmpty();
    }

    logger.info("Successfully fetched rss content");

    const updateContentResult = await ItemRepository.createContent(updatedContent, feed.id);

    if (!updateContentResult.success) {
        logger.error("Failed to update content", updateContentResult.message);
        throw new Error(
            `Failed to update content for feed ${feed.id}: ${updateContentResult.message}`
        );
    }

    if (updateContentResult.data.length === 0) {
        logger.info("No new content");
        return Result.okEmpty();
    }

    await addToUsersWorker.add({
        content: updateContentResult.data,
        feedId: feed.id,
    });

    return Result.okEmpty();
};

const worker = new Worker<FetchJobData>(QUEUE_NAME, processor, options);

export const fetchWorker: WorkerType<FetchJobData> = {
    start: async () => {
        await worker.waitUntilReady();
    },
    add: async (data: FetchJobData) => {
        await fetchQueue.add(JOB_NAME, data);
    },
    close: async () => {
        await fetchQueue.close();
        await worker.close();
    },
    repeatable: async (data: FetchJobData, timeInMs = toMilliseconds({ minutes: 15 })) => {
        await fetchQueue.add(JOB_NAME, data, {
            repeat: {
                every: timeInMs,
            },
        });
    },
    stopRepeatable: async () => {
        const repeatableJobs = await fetchQueue.getRepeatableJobs();
        await Promise.all(
            repeatableJobs.map(async job => {
                await fetchQueue.removeRepeatableByKey(job.key);
            })
        );
    },
};
