import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import "dotenv/config";
import express from "express";
import { addToUsersWorker, fetchWorker } from "server";
import { Result } from "utils";
import { start } from "./worker";

const PORT = Number.parseInt(process.env.PORT ?? "3000");

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

    // eslint-disable-next-line consistent-return
    app.use((req, res, next) => {
        if (!req.headers["auth-token"]) {
            return res.status(401).json(Result.error("Unauthorized", "Unauthorized"));
        }

        const token = req.headers["auth-token"];

        if (token !== process.env.AUTH_TOKEN) {
            return res.status(401).json(Result.error("Unauthorized", "Unauthorized"));
        }

        next();
    });

    app.use("/ui", serverAdapter.getRouter());

    app.use("/api/repeatable", async (req, res) => {
        const feedId = req.query.feedId;

        if (!feedId) {
            return res.status(400).json(Result.error("feedId is required", "BadRequest"));
        }

        if (typeof feedId !== "string") {
            return res.status(400).json(Result.error("feedId must be a string", "BadRequest"));
        }

        if (Number.isNaN(Number.parseInt(feedId))) {
            return res.status(400).json(Result.error("feedId must be a number", "BadRequest"));
        }

        const id = Number.parseInt(feedId);

        await fetchWorker.repeatable({ feedId: id });

        res.json(Result.okEmpty());
    });

    await start();

    app.listen(PORT, () => {
        console.log(`Running on ${PORT}...`);
        console.log("For the UI, open https://<url>/ui");
    });
};

run().catch(error => console.error(error));
