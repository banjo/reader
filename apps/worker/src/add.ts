import { fetchWorker } from "@/workers/fetch/fetch-worker";
import { FeedWithContent, prisma } from "db";

export const addFetchRss = async () => {
    const feeds: FeedWithContent[] = await prisma.feed.findMany({
        include: {
            contentItems: true,
        },
    });

    for (const feed of feeds) {
        await fetchWorker.repeatable({ feed });
    }
};
