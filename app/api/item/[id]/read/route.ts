import { ItemService } from "@/server/services/ItemService";
import { ResponseService } from "@/server/services/ResponseService";
import { z } from "zod";

const itemPutSchema = z.object({
    markAsRead: z.boolean(),
});

const itemIdSchema = z.number();

type PutProps = {
    params: {
        id: string;
    };
};

export async function PUT(req: Request, { params }: PutProps) {
    const id = params.id;

    const idResult = itemIdSchema.safeParse(Number(id));

    if (!idResult.success) {
        return ResponseService.error(idResult.error.message, "BadRequest");
    }
    const res = await req.json();
    const parseResult = itemPutSchema.safeParse(res);

    if (!parseResult.success) {
        return ResponseService.error(parseResult.error.message, "BadRequest");
    }

    const item = await ItemService.markAsRead(Number(idResult.data), parseResult.data.markAsRead);

    if (!item.success) {
        return ResponseService.error(item.message, item.type);
    }

    return ResponseService.success(item.data);
}
