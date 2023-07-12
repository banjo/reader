import { fetchWorker } from "@/workers/fetch/fetch-worker";
import { prisma } from "db";

const addFetchRss = async () => {
    const feeds = await prisma.feed.findMany();

    feeds.forEach(async feed => {
        await fetchWorker.repeatable({ url: feed.url });
    });
};
