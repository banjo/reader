import { ItemService } from "@/server/services/ItemService";
import { ResponseService } from "@/server/services/ResponseService";
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
    // TODO: add validation
    const body = await req.json();

    const item = await ItemService.updateItem(body);

    if (!item.success) {
        return ResponseService.error(item.message, item.type);
    }

    return ResponseService.emptySuccess();
}
