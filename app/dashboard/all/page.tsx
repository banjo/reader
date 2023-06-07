import { AllContainer } from "@/components/features/feed/containers/all-container";
import { FeedService } from "@/src/server/services/FeedService";
import { ServerComponentService } from "@/src/server/services/ServerComponentService";

export const revalidate = 0;

export default async function AllPage() {
    const userId = await ServerComponentService.getUserId();
    const feedResponse = await FeedService.getAllFeedsByUserId(userId);

    if (!feedResponse.success) {
        throw new Error(feedResponse.message);
    }

    const feeds = feedResponse.data;

    return <AllContainer feeds={feeds} />;
}
