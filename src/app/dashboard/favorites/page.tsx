import { FavoriteContainer } from "@/client/features/feed/containers/favorite-container";
import { FeedService } from "@/server/services/FeedService";
import { ServerComponentService } from "@/server/services/ServerComponentService";

export const revalidate = 0;

export default async function FavoritePage() {
    const userId = await ServerComponentService.getUserId();
    const feedResponse = await FeedService.getAllFeedsByUserId(userId);

    if (!feedResponse.success) {
        throw new Error(feedResponse.message);
    }

    return <FavoriteContainer feeds={feedResponse.data} />;
}
