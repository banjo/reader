import { options } from "@/config";
import { WorkerType } from "@/types";
import { toMilliseconds } from "@banjoanton/utils";
import { Job, Queue, Worker } from "bullmq";

type FetchJobData = {
    url: string;
};

const QUEUE_NAME = "fetch";
const JOB_NAME = "fetch-job";
const fetchQueue = new Queue<FetchJobData>(QUEUE_NAME, options);

export const processor = async (job: Job<FetchJobData>) => {
    const { url } = job.data;

    console.log(`Fetching ${url}`);

    return { url };
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
