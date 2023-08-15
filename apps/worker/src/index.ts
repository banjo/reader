import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import "dotenv/config";
import express from "express";
import morgan from "morgan";
import { addImageWorker, addToUsersWorker, fetchWorker, imageWorker } from "server";
import { Result, createLogger } from "utils";
import { start } from "./worker";

const PORT = Number.parseInt(process.env.PORT ?? "3001");
const isProd = process.env.NODE_ENV === "production";
const logger = createLogger("WorkerApp");

const run = async () => {
    const app = express();

    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath("/ui");

    createBullBoard({
        queues: [
            new BullMQAdapter(fetchWorker.getQueue()),
            new BullMQAdapter(addToUsersWorker.getQueue()),
            new BullMQAdapter(imageWorker.getQueue()),
            new BullMQAdapter(addImageWorker.getQueue()),
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

    await start();

    app.listen(PORT, () => {
        console.log(`Running on port ${PORT} in mode ${isProd ? "production" : "development"}...`);
        console.log("For the UI, open https://<url>/ui");
    });
};

run().catch(error => console.error(error));
