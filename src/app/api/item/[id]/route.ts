import { ItemService } from "@/server/services/ItemService";
import { RequestService } from "@/server/services/RequestService";
import { ResponseService } from "@/server/services/ResponseService";
import { CleanItemSchema } from "@/shared/models/entities";
import { z } from "zod";

const itemIdSchema = z.number();

export async function GET(req: Request) {
    const idResult = RequestService.getSearchParams(req, "id", itemIdSchema); // TODO: remove, not correct

    if (!idResult.success) {
        return ResponseService.error(idResult.message, "BadRequest");
    }

    const item = await ItemService.getItemById(Number(idResult.data));

    if (!item.success) {
        return ResponseService.error(item.message, item.type);
    }

    return ResponseService.success(item.data);
}

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
    const bodyResult = CleanItemSchema.safeParse(res);

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