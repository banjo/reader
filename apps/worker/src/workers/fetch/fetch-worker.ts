import { Job, Queue, Worker } from "bullmq";
import { options } from "../../config";

type FetchJobData = {
    url: string;
};

const QUEUE_NAME = "fetch";
const JOB_NAME = "fetch-job";
const fetchQueue = new Queue<FetchJobData>(QUEUE_NAME, options);

const processor = async (job: Job<FetchJobData>) => {
    console.log(job.data);
};

const worker = new Worker<FetchJobData>(QUEUE_NAME, processor, options);

export const fetchWorker = {
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
    repeatable: async (data: FetchJobData, timeInMs = 60000) => {
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
    running: async () => {
        const jobs = await fetchQueue.getJobs(["active"]);
        const repeatableJobs = await fetchQueue.getRepeatableJobs();
        return [...jobs, ...repeatableJobs];
    },
};
