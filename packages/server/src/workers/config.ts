import { QueueOptions } from "bullmq";

const HOST = process.env.REDIS_HOST ?? "localhost";
const PORT = parseInt(process.env.REDIS_PORT ?? "6379");
const PASSWORD = process.env.REDIS_PASSWORD ?? undefined;

export const redisConfig: QueueOptions = {
    connection: {
        host: HOST,
        port: PORT,
        password: PASSWORD,
    },
};
