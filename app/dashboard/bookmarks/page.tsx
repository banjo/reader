import { BookmarkContainer } from "@/components/features/feed/containers/bookmark-container";
import { FeedService } from "@/src/server/services/FeedService";
import { ServerComponentService } from "@/src/server/services/ServerComponentService";

export const revalidate = 0;

export default async function BookmarksPage() {
    const userId = await ServerComponentService.getUserId();
    const feedResponse = await FeedService.getAllFeedsByUserId(userId);

    if (!feedResponse.success) {
        throw new Error(feedResponse.message);
    }

    return <BookmarkContainer feeds={feedResponse.data} />;
}
