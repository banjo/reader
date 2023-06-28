import { ClientAuthContainer } from "@/client/components/utils/client-auth-container";
import { FavoriteContainer } from "@/client/features/items/containers/favorite-container";
import { ItemService } from "@/server/services/ItemService";
import { ServerComponentService } from "@/server/services/ServerComponentService";

export const revalidate = 0;

export default async function FavoritePage() {
    const userId = await ServerComponentService.getUserId();
    const allItemsResponse = await ItemService.getAllItemsByUserId(userId);

    if (!allItemsResponse.success) {
        throw new Error(allItemsResponse.message);
    }

    return (
        <ClientAuthContainer>
            <FavoriteContainer items={allItemsResponse.data} />
        </ClientAuthContainer>
    );
}
