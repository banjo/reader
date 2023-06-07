import { FeedService } from "@/src/server/services/FeedService";
import { RequestService } from "@/src/server/services/RequestService";
import { ResponseService } from "@/src/server/services/ResponseService";

export async function GET(req: Request) {
    const userId = RequestService.getUserId(req);

    const feed = await FeedService.getAllFeedsByUserId(userId);

    if (!feed.success) {
        return ResponseService.error(feed.message, feed.type);
    }

    return ResponseService.success(feed.data);
}
