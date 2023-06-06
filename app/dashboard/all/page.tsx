import { TableContainer } from "@/components/table/table-container";
import { FeedRepository } from "@/server/repositories/FeedRepository";
import { ServerComponentService } from "@/server/services/ServerComponentService";

export const revalidate = 0;

export default async function AllPage() {
    const userId = await ServerComponentService.getUserId(); // TODO: check if user has access to feed
    const feedResponse = await FeedRepository.getAllUserFeeds(userId);

    if (!feedResponse.success) {
        console.log("no feed found in db");
        return <div>feed not found</div>; // TODO: create error page
    }

    const feeds = feedResponse.data;

    return (
        <div className="flex flex-col gap-4">
            All
            <TableContainer feeds={feeds} />
            <div></div>
        </div>
    );
}
