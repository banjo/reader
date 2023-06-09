import { FeedService } from "@/server/services/FeedService";
import { RequestService } from "@/server/services/RequestService";
import { ResponseService } from "@/server/services/ResponseService";
import { z } from "zod";

export async function GET(req: Request) {
    const userId = RequestService.getUserId(req);

    const feed = await FeedService.getAllFeedsByUserId(userId);

    if (!feed.success) {
        return ResponseService.error(feed.message, feed.type);
    }

    return ResponseService.success(feed.data);
}

const postBodySchema = z.object({
    url: z.string().url(),
});

export async function POST(req: Request) {
    const userId = RequestService.getUserId(req);
    const body = await req.json();
    const bodyResult = postBodySchema.safeParse(body);

    if (!bodyResult.success) {
        const { errors } = bodyResult.error;
        return ResponseService.badRequest("body", errors);
    }

    const item = await FeedService.addFeed(bodyResult.data.url, userId);

    if (!item.success) {
        return ResponseService.error(item.message, item.type);
    }

    return ResponseService.emptySuccess();
}
