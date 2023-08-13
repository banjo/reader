import { raise } from "@banjoanton/utils";
import { QueueOptions } from "bullmq";

const getConnection = () => {
    const isProd = process.env.NODE_ENV === "production";

    if (isProd) {
        return {
            host: process.env.REDIS_HOST ?? raise("REDIS_HOST is not set"),
            port: Number.parseInt(process.env.REDIS_PORT ?? raise("REDIS_PORT is not set")),
            password: process.env.REDIS_PASSWORD ?? raise("REDIS_PASSWORD is not set"),
        };
    }

    return {
        host: "localhost",
        port: 6379,
        password: undefined,
    };
};

export const redisConfig: QueueOptions = {
    connection: getConnection(),
};
