import { isBrowser } from "@banjoanton/utils";
import { pino, TransportTargetOptions } from "pino";

let sharedTransport: any;

export const createLogger = (name: string) => {
    if (isBrowser()) {
        return pino({ name });
    }

    const targets: TransportTargetOptions[] = [
        {
            target: "pino-pretty",
            options: {
                colorize: true,
                ignore: "hostname,pid",
            },
            level: "trace",
        },
    ];

    if (process.env.NODE_ENV === "production") {
        const DATASET = process.env.AXIOM_DATASET ?? raise("AXIOM_DATASET is not set");
        const AXIOM_TOKEN = process.env.AXIOM_TOKEN ?? raise("AXIOM_TOKEN is not set");

        targets.push({
            target: "@axiomhq/pino",
            options: {
                dataset: DATASET,
                token: AXIOM_TOKEN,
            },
            level: "trace",
        });
    }

    if (!sharedTransport) {
        sharedTransport = pino.transport({
            targets,
        });
    }

    return pino({ name }, sharedTransport);
};

export { type Logger } from "pino";
