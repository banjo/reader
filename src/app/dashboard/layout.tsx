import { SideMenuClientContainer } from "@/client/components/nav/sidemenu/side-menu-client-container";
import { FeedService } from "@/server/services/FeedService";
import { ServerComponentService } from "@/server/services/ServerComponentService";
import { redirect } from "next/navigation";

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
            <SideMenuClientContainer prefix="/dashboard" feeds={feeds.data} />
            <main className="flex-1 p-6">{children}</main>
        </section>
    );
}
