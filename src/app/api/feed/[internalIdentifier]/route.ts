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

    const internalIdentifierResult = internalIdentifierSchema.safeParse(internalIdentifier);

    if (!internalIdentifierResult.success) {
        return ResponseService.badRequest(
            "Internal identifier",
            internalIdentifierResult.error.errors
        );
    }

    const item = await FeedService.getFeedByInternalIdentifier(
        internalIdentifierResult.data,
        userId
    );

    if (!item.success) {
        return ResponseService.error(item.message, item.type);
    }

    return ResponseService.success(item.data);
}
