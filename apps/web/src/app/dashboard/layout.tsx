import { SideMenuContainer } from "@/client/components/nav/sidemenu/side-menu-container";
import { ClientAuthContainer } from "@/client/components/utils/client-auth-container";
import { ServerComponentService } from "@/server/services/ServerComponentService";
import { redirect } from "next/navigation";
import { FeedService } from "server";

type Props = {
    children: React.ReactNode;
};

export const revalidate = 0;

export default async function DashboardLayout({ children }: Props) {
    const userId = await ServerComponentService.getUserId();
    const feeds = await FeedService.getAllFeedsByUserId(userId);

    if (!feeds.success) {
        console.log("no feeds found in db");
        redirect("/");
    }

    return (
        <section className="flex">
            <ClientAuthContainer>
                <SideMenuContainer prefix="/dashboard" feeds={feeds.data} />
            </ClientAuthContainer>
            <main className="flex-1 p-6">{children}</main>
        </section>
    );
}
