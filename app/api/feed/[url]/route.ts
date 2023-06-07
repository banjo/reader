import { FeedService } from "@/src/server/services/FeedService";
import { ResponseService } from "@/src/server/services/ResponseService";
import { z } from "zod";

const fallbackUrlSchema = z.string();

type GetProps = {
    params: {
        url: string;
    };
};

export async function GET(req: Request, { params }: GetProps) {
    const url = params.url;

    const fallbackUrlResult = fallbackUrlSchema.safeParse(url);

    if (!fallbackUrlResult.success) {
        return ResponseService.badRequest("url param", fallbackUrlResult.error.errors);
    }

    const item = await FeedService.getFeedByPublicUrl(fallbackUrlResult.data);

    if (!item.success) {
        return ResponseService.error(item.message, item.type);
    }

    return ResponseService.success(item.data);
}
