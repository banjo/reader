import { ItemService } from "@/src/server/services/ItemService";
import { RequestService } from "@/src/server/services/RequestService";
import { ResponseService } from "@/src/server/services/ResponseService";
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
