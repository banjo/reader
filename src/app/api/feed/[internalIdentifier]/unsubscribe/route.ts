import { FeedService } from "@/server/services/FeedService";
import { RequestService } from "@/server/services/RequestService";
import { ResponseService } from "@/server/services/ResponseService";

export async function POST(req: Request, context: { params: { internalIdentifier: string } }) {
    const userId = RequestService.getUserId(req);
    const internalIdentifier = context.params.internalIdentifier;

    console.log("🪕%c Banjo | route.ts:9 |", "color: #E91E63", internalIdentifier);

    const item = await FeedService.unsubscribeFromFeed(internalIdentifier, userId);

    if (!item.success) {
        return ResponseService.error(item.message, item.type);
    }

    return ResponseService.emptySuccess();
}
