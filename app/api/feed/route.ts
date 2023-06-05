import { FeedRepository } from "@/server/repositories/FeedRepository";
import { RequestService } from "@/server/services/RequestService";
import { ResponseService } from "@/server/services/ResponseService";

export async function GET(req: Request) {
    const userId = RequestService.getUserId(req);

    const feed = await FeedRepository.getAllUserFeeds(userId);

    if (!feed.success) {
        return ResponseService.error(feed.message, feed.type);
    }

    return ResponseService.success(feed.data);
}
