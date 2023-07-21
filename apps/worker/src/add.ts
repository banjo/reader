import { fetchWorker } from "@/workers/fetch/fetch-worker";
import { FeedWithContent, prisma } from "db";
import { createLogger } from "server";

const logger = createLogger("AddFetchRss");

export const addFetchRss = async () => {
    logger.info("Adding fetch rss...");
    const feeds: FeedWithContent[] = await prisma.feed.findMany({
        include: {
            contentItems: true,
        },
    });

    logger.info(`Found ${feeds.length} feeds`);

    for (const feed of feeds) {
        logger.info(`Adding ${feed.url} to fetch rss...`);
        await fetchWorker.repeatable({ feed });
    }

    logger.info("Done");
};
