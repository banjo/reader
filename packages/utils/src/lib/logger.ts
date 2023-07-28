// import { raise } from "@banjoanton/utils";
// import "dotenv/config";
import { pino } from "pino";
// import {TransportTargetOptions} from "pino";

export const createLogger = (name: string) => {
    // const targets: TransportTargetOptions[] = [
    //     {
    //         target: "pino-pretty",
    //         options: {
    //             colorize: true,
    //             ignore: "hostname,pid",
    //         },
    //         level: "trace",
    //     },
    // ];

    // if (process.env.NODE_ENV === "production") {
    //     const DATASET = process.env.AXIOM_DATASET ?? raise("AXIOM_DATASET is not set");
    //     const AXIOM_TOKEN = process.env.AXIOM_TOKEN ?? raise("AXIOM_TOKEN is not set");

    //     targets.push({
    //         target: "@axiomhq/pino",
    //         options: {
    //             dataset: DATASET,
    //             token: AXIOM_TOKEN,
    //         },
    //         level: "trace",
    //     });
    // }

    // const transport = pino.transport({
    //     targets,
    // });

    return pino({ name });
};
