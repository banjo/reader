import { options } from "@/config";
import { toMilliseconds } from "@banjoanton/utils";
import { Job, Queue, Worker } from "bullmq";
import { paramCase, pascalCase } from "change-case";
import { ResultType, createLogger } from "server";


export const createWorker = <T extends object>(
    name: string,
    processor: (job: Job<T>) => Promise<ResultType<void>>
) => {
    const logger = createLogger(`CreateWorker${pascalCase(name)}`);
    const QUEUE_NAME = `${paramCase(name)}-queue`;
    const JOB_NAME = `${paramCase(name)}-job`;
    const queue = new Queue<T>(QUEUE_NAME, options);
    const worker = new Worker<T>(QUEUE_NAME, processor, options);

    const wrapper = {
        start: async () => {
            logger.info("Starting...");
            await worker.waitUntilReady();
        },
        add: async (data: T) => {
            logger.info("Adding job...");
            await queue.add(JOB_NAME, data);
        },
        close: async () => {
            logger.info("Closing...");
            await queue.close();
            await worker.close();
        },
        repeatable: async (data: T, timeInMs = toMilliseconds({ minutes: 15 })) => {
            logger.info(`Adding repeatable job every ${timeInMs}ms...`);
            await queue.add(JOB_NAME, data, {
                repeat: {
                    every: timeInMs,
                    immediately: true,
                },
            });
        },
        stopRepeatable: async () => {
            const repeatableJobs = await queue.getRepeatableJobs();
            logger.info(`Stopping ${repeatableJobs.length} repeatable jobs...`);
            await Promise.all(
                repeatableJobs.map(async job => {
                    await queue.removeRepeatableByKey(job.key);
                })
            );
        },
        activeCount: async () => {
            logger.info("Getting active count...");
            return await queue.getActiveCount();
        },
    };

    return wrapper;
};
