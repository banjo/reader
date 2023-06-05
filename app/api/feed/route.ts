import { FeedRepository } from "../../../repositories/FeedRepository";
import { RequestService } from "../../../services/RequestService";
import { ResponseService } from "../../../services/ResponseService";

export async function GET(req: Request) {
    const userId = RequestService.getUserId(req);

    const feed = await FeedRepository.getAllUserFeeds(userId);

    if (!feed.success) {
        return ResponseService.error(feed.message, feed.type);
    }

    return ResponseService.success(feed.data);
}
