import { Logger } from "tslog";

export const createLogger = (name: string) =>
    new Logger({
        name,
        type: "pretty",
    });
