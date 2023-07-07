import { ItemService } from "@/server/services/ItemService";
import { ResponseService } from "@/server/services/ResponseService";
import { z } from "zod";

const postBodySchema = z.object({
    ids: z.array(z.number()),
});

export async function POST(req: Request) {
    const body = await req.json();
    const bodyResult = postBodySchema.safeParse(body);

    if (!bodyResult.success) {
        const { errors } = bodyResult.error;
        return ResponseService.badRequest("body", errors);
    }

    const item = await ItemService.markItemsAsRead(bodyResult.data.ids);

    if (!item.success) {
        return ResponseService.error(item.message, item.type);
    }

    return ResponseService.emptySuccess();
}
