import { ClientAuthContainer } from "@/client/components/utils/client-auth-container";
import { AllContainer } from "@/client/features/items/containers/all-container";
import { ServerComponentService } from "@/server/services/ServerComponentService";
import { ItemService } from "server";

export const revalidate = 0;

export default async function AllPage() {
    const userId = await ServerComponentService.getUserId();
    const allItemsResponse = await ItemService.getAllItemsByUserId(userId);

    if (!allItemsResponse.success) {
        throw new Error(allItemsResponse.message);
    }

    return (
        <ClientAuthContainer>
            <AllContainer items={allItemsResponse.data} />
        </ClientAuthContainer>
    );
}
