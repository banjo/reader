import { ensureDbReady, Feed, prisma } from "db";
import { fetchRssFeedWorker } from "server";
import { createLogger } from "utils";

const logger = createLogger("AddFetchRss");

export const addFetchRss = async () => {
    ensureDbReady();

    logger.info("Adding fetch rss...");
    const feeds: Feed[] = await prisma.feed.findMany();

    logger.info(`Found ${feeds.length} feeds`);

    for (const feed of feeds) {
        logger.info(`Adding ${feed.url} to fetch rss...`);
        await fetchRssFeedWorker().repeatable({ feedId: feed.id });
    }

    logger.info("Done");
};
