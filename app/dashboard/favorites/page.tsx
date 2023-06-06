import { TableContainer } from "@/components/table/table-container";
import { FeedRepository } from "@/server/repositories/FeedRepository";
import { ServerComponentService } from "@/server/services/ServerComponentService";

export const revalidate = 0;

export default async function FavoritePage() {
    const userId = await ServerComponentService.getUserId();
    const feedResponse = await FeedRepository.getAllUserFeeds(userId);

    if (!feedResponse.success) {
        console.log("no feed found in db");
        return <div>feed not found</div>; // TODO: create error page
    }

    const filtered = feedResponse.data.map(feed => {
        return {
            ...feed,
            items: feed.items.filter(item => item.isFavorite),
        };
    });

    return (
        <div className="flex flex-col gap-4">
            All
            <TableContainer feeds={filtered} />
            <div></div>
        </div>
    );
}
