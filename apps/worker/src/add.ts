import { fetchWorker } from "@/workers/fetch/fetch-worker";
import { Feed, prisma } from "db";
import { createLogger } from "server";

const logger = createLogger("AddFetchRss");

export const addFetchRss = async () => {
    logger.info("Adding fetch rss...");
    const feeds: Feed[] = await prisma.feed.findMany();

    logger.info(`Found ${feeds.length} feeds`);

    for (const feed of feeds) {
        logger.info(`Adding ${feed.url} to fetch rss...`);
        await fetchWorker.repeatable({ feedId: feed.id });
    }

    logger.info("Done");
};
