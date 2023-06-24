import { ItemService } from "@/server/services/ItemService";
import { ResponseService } from "@/server/services/ResponseService";
import { CleanItemSchema } from "@/shared/models/entities";
import { z } from "zod";

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
    const body = await req.json();
    const bodyResult = CleanItemSchema.safeParse(body);

    if (!bodyResult.success) {
        const { errors } = bodyResult.error;
        return ResponseService.badRequest("body", errors);
    }

    const item = await ItemService.updateItem(bodyResult.data);

    if (!item.success) {
        return ResponseService.error(item.message, item.type);
    }

    return ResponseService.emptySuccess();
}
