import { ItemService } from "@/server/services/ItemService";
import { ResponseService } from "@/server/services/ResponseService";
import { z } from "zod";

const putBodySchema = z.object({
    markAsRead: z.boolean(),
});

const putIdSchema = z.number();

type PutProps = {
    params: {
        id: string;
    };
};

export async function PUT(req: Request, { params }: PutProps) {
    const id = params.id;

    const idResult = putIdSchema.safeParse(Number(id));

    if (!idResult.success) {
        const { errors } = idResult.error;
        return ResponseService.badRequest("id", errors);
    }
    const res = await req.json();
    const bodyResult = putBodySchema.safeParse(res);

    if (!bodyResult.success) {
        const { errors } = bodyResult.error;
        return ResponseService.badRequest("body", errors);
    }

    const item = await ItemService.markAsRead(idResult.data, bodyResult.data.markAsRead);

    if (!item.success) {
        return ResponseService.error(item.message, item.type);
    }

    return ResponseService.success(item.data);
}
