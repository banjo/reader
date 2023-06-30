import { ItemService } from "@/server/services/ItemService";
import { RequestService } from "@/server/services/RequestService";
import { ResponseService } from "@/server/services/ResponseService";

export async function GET(req: Request) {
    const userId = RequestService.getUserId(req);

    const itemsResponse = await ItemService.getAllItemsByUserId(userId);

    if (!itemsResponse.success) {
        return ResponseService.error(itemsResponse.message, itemsResponse.type);
    }

    return ResponseService.success(itemsResponse.data);
}
