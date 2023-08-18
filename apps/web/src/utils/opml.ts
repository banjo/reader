import { parseXml } from "@/utils/reader";
import { isDefined } from "@banjoanton/utils";

export const parseOpmlRssSubscriptions = async (file: File): Promise<string[]> => {
    const xml = await parseXml(file);
    const body = xml.querySelector("body");
    const outlines = body?.querySelectorAll("outline");
    const feeds = Array.from(outlines || []);
    const subscriptions = feeds
        .map(feed => {
            const type = feed.getAttribute("type");
            const url = feed.getAttribute("xmlUrl");

            if (!url || !type) {
                return undefined;
            }

            return { url, type };
        })
        .filter(isDefined)
        .filter(subscription => subscription.type === "rss")
        .map(subscription => subscription.url);

    return subscriptions;
};
