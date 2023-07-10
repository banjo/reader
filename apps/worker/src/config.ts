import { QueueOptions } from "bullmq";

export const options: QueueOptions = {
    connection: {
        host: "localhost",
        port: 6379,
    },
};
