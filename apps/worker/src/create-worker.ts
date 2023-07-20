import { options } from "@/config";
import { toMilliseconds } from "@banjoanton/utils";
import { Job, Queue, Worker } from "bullmq";
import { paramCase } from "change-case";
import { ResultType } from "server";

export const createWorker = <T extends object>(
    name: string,
    processor: (job: Job<T>) => Promise<ResultType<void>>
) => {
    const QUEUE_NAME = `${paramCase(name)}-queue`;
    const JOB_NAME = `${paramCase(name)}-job`;
    const queue = new Queue<T>(QUEUE_NAME, options);
    const worker = new Worker<T>(QUEUE_NAME, processor, options);

    const wrapper = {
        start: async () => {
            await worker.waitUntilReady();
        },
        add: async (data: T) => {
            await queue.add(JOB_NAME, data);
        },
        close: async () => {
            await queue.close();
            await worker.close();
        },
        repeatable: async (data: T, timeInMs = toMilliseconds({ minutes: 15 })) => {
            await queue.add(JOB_NAME, data, {
                repeat: {
                    every: timeInMs,
                    immediately: true,
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
        activeCount: async () => {
            return await queue.getActiveCount();
        },
    };

    return wrapper;
};
