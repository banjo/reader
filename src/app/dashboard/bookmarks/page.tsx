import { ClientAuthContainer } from "@/client/components/utils/client-auth-container";
import { BookmarkContainer } from "@/client/features/items/containers/bookmark-container";
import { ItemService } from "@/server/services/ItemService";
import { ServerComponentService } from "@/server/services/ServerComponentService";

export const revalidate = 0;

export default async function BookmarksPage() {
    const userId = await ServerComponentService.getUserId();
    const allItemsResponse = await ItemService.getAllItemsByUserId(userId);

    if (!allItemsResponse.success) {
        throw new Error(allItemsResponse.message);
    }

    return (
        <ClientAuthContainer>
            <BookmarkContainer items={allItemsResponse.data} />
        </ClientAuthContainer>
    );
}
