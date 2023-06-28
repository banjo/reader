import { ClientAuthContainer } from "@/client/components/utils/client-auth-container";
import { AllContainer } from "@/client/features/items/containers/all-container";
import { ItemService } from "@/server/services/ItemService";
import { ServerComponentService } from "@/server/services/ServerComponentService";

export const revalidate = 0;

export default async function AllPage() {
    const userId = await ServerComponentService.getUserId();
    const allItemsResponse = await ItemService.getAllItemsByUserId(userId);

    if (!allItemsResponse.success) {
        throw new Error(allItemsResponse.message);
    }

    const items = allItemsResponse.data;

    return (
        <ClientAuthContainer>
            <AllContainer items={items} />
        </ClientAuthContainer>
    );
}
