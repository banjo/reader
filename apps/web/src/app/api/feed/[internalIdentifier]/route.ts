import { FeedService } from "@/server/services/FeedService";
import { RequestService } from "@/server/services/RequestService";
import { ResponseService } from "@/server/services/ResponseService";
import { z } from "zod";

const internalIdentifierSchema = z.string();

type GetProps = {
    params: {
        internalIdentifier: string;
    };
};

export async function GET(req: Request, { params }: GetProps) {
    const internalIdentifier = params.internalIdentifier;
    const userId = RequestService.getUserId(req);

    const internalIdentifierResult =
        internalIdentifierSchema.safeParse(internalIdentifier);

    if (!internalIdentifierResult.success) {
        return ResponseService.badRequest(
            "Internal identifier",
            internalIdentifierResult.error.errors,
        );
    }

    const feedResult = await FeedService.getFeedWithItemsOrContent(
        internalIdentifierResult.data,
        userId,
    );

    if (!feedResult.success) {
        return ResponseService.error(feedResult.message, feedResult.type);
    }

    return ResponseService.success(feedResult.data);
}
