import { Logger } from "tslog";

const createLogger = (name: string) =>
    new Logger({
        name,
        type: "pretty",
    });

export default createLogger;
