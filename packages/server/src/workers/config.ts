import { raise } from "@banjoanton/utils";
import { QueueOptions } from "bullmq";

export type RedisConnection = {
    host: string;
    port: number;
    password?: string;
};

export const getRedisConnection = (): RedisConnection => {
    if (process.env.NODE_ENV === "test" && process.env.TEST_REDIS_URL) {
        const url = new URL(process.env.TEST_REDIS_URL);
        return {
            host: url.hostname,
            port: Number.parseInt(url.port) || 6379,
            password: decodeURIComponent(url.password) || undefined,
        };
    }

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
    connection: getRedisConnection(),
};
