import { FeedService } from "@/server/services/FeedService";
import { RequestService } from "@/server/services/RequestService";
import { ResponseService } from "@/server/services/ResponseService";
import { z } from "zod";

const searchQuerySchema = z.string();

export async function GET(req: Request) {
    const queryResult = RequestService.getQueryParams(
        req,
        "query",
        searchQuerySchema,
    );

    if (!queryResult.success) {
        return ResponseService.error(queryResult.message, queryResult.type);
    }

    const userId = RequestService.getUserId(req);

    const queryParseResult = searchQuerySchema.safeParse(queryResult.data);

    if (!queryParseResult.success) {
        return ResponseService.badRequest(
            "query parameter",
            queryParseResult.error.issues,
        );
    }

    const item = await FeedService.searchFeeds(queryParseResult.data, userId);

    if (!item.success) {
        return ResponseService.error(item.message, item.type);
    }

    return ResponseService.success(item.data);
}
