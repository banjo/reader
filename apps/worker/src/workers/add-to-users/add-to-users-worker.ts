import { options } from "@/config";
import { WorkerType } from "@/types";
import { toMilliseconds } from "@banjoanton/utils";
import { Job, Queue, Worker } from "bullmq";
import { ItemContent } from "db";
import { createLogger, ItemRepository, Result, UserRepository } from "server";

const logger = createLogger("AddToUsersWorker");

type AddToUsersJobData = {
    content: ItemContent[];
    feedId: number;
};

const QUEUE_NAME = "add-to-user-queue";
const JOB_NAME = "add-to-user-job";
const queue = new Queue<AddToUsersJobData>(QUEUE_NAME, options);

export const processor = async (job: Job<AddToUsersJobData>) => {
    const { content, feedId } = job.data;

    const users = await UserRepository.getUsersByFeedId(feedId);

    if (!users) {
        logger.info(`No users found for feedId: ${feedId}`);
        return Result.okEmpty();
    }

    logger.info(`Adding ${content.length} items to ${users.length} users`);

    await Promise.all(
        users.map(async user => {
            const result = await ItemRepository.createItemsFromContent(content, feedId, user.id);

            if (!result.success) {
                logger.error(`Failed to add items to user ${user.id}`, result.message);
                throw new Error(`Failed to add items to user ${user.id}: ${result.message}`);
            }

            logger.info(`Added ${content.length} items to user with id ${user.id}`);
        })
    );

    logger.info(`Successfully added ${content.length} items to ${users.length} users`);

    return Result.okEmpty();
};

const worker = new Worker<AddToUsersJobData>(QUEUE_NAME, processor, options);

export const addToUsersWorker: WorkerType<AddToUsersJobData> = {
    start: async () => {
        await worker.waitUntilReady();
    },
    add: async (data: AddToUsersJobData) => {
        await queue.add(JOB_NAME, data);
    },
    close: async () => {
        await queue.close();
        await worker.close();
    },
    repeatable: async (data: AddToUsersJobData, timeInMs = toMilliseconds({ minutes: 15 })) => {
        await queue.add(JOB_NAME, data, {
            repeat: {
                every: timeInMs,
            },
        });
    },
    stopRepeatable: async () => {
        const repeatableJobs = await queue.getRepeatableJobs();
        await Promise.all(
            repeatableJobs.map(async job => {
                await queue.removeRepeatableByKey(job.key);
            })
        );
    },
};
