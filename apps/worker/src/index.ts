import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import "dotenv/config";
import express from "express";
import morgan from "morgan";
import { Result, createLogger } from "utils";
import { addToUsersWorker, fetchWorker } from "worker-utils";
import { start } from "./worker";

const PORT = Number.parseInt(process.env.PORT ?? "3000");
const logger = createLogger("Worker");

const run = async () => {
    const app = express();

    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath("/ui");

    createBullBoard({
        queues: [
            new BullMQAdapter(fetchWorker.getQueue()),
            new BullMQAdapter(addToUsersWorker.getQueue()),
        ],
        serverAdapter,
    });

    app.use("/api", morgan("tiny"));

    // eslint-disable-next-line consistent-return
    app.use((req, res, next) => {
        const authToken = req.headers["auth-token"];
        if (!authToken) {
            logger.error("auth-token is required in header");
            return res.status(401).json(Result.error("Unauthorized", "Unauthorized"));
        }

        const secret = process.env.AUTH_TOKEN;

        if (!secret) {
            logger.error("AUTH_TOKEN is not set");
            return res.status(500).json(Result.error("Internal Server Error", "InternalError"));
        }

        if (authToken !== secret) {
            logger.error("auth-token is invalid");
            return res.status(401).json(Result.error("Unauthorized", "Unauthorized"));
        }

        next();
    });

    app.use("/ui", serverAdapter.getRouter());

    app.use("/api/repeatable", async (req, res) => {
        const feedId = req.query.feedId;

        if (!feedId) {
            logger.error("feedId is required");
            return res.status(400).json(Result.error("feedId is required", "BadRequest"));
        }

        if (typeof feedId !== "string") {
            logger.error("feedId must be a number");
            return res.status(400).json(Result.error("feedId must be a string", "BadRequest"));
        }

        if (Number.isNaN(Number.parseInt(feedId))) {
            logger.error("feedId must be a number");
            return res.status(400).json(Result.error("feedId must be a number", "BadRequest"));
        }

        const id = Number.parseInt(feedId);

        logger.info(`Adding repeatable job for feedId ${id}`);
        try {
            await fetchWorker.repeatable({ feedId: id });
        } catch (error: unknown) {
            let e: string;
            if (error instanceof Error) {
                logger.error(error.message);
                e = error.message;
            } else if (typeof error === "string") {
                logger.error(error);
                e = error;
            } else {
                e = "Internal Server Error";
            }

            return res.status(500).json(Result.error(e, "InternalError"));
        }
        logger.info(`Added repeatable job for feedId ${id}`);

        res.json(Result.okEmpty());
    });

    await start();

    app.listen(PORT, () => {
        console.log(`Running on ${PORT}...`);
        console.log("For the UI, open https://<url>/ui");
    });
};

run().catch(error => console.error(error));
