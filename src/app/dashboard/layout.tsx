import { SideMenuContainer } from "@/client/components/nav/sidemenu/side-menu-container";
import { FeedService } from "@/server/services/FeedService";
import { ServerComponentService } from "@/server/services/ServerComponentService";
import { redirect } from "next/navigation";

type Props = {
    children: React.ReactNode;
};

export const revalidate = 0; // TODO: set revalidate to 60 seconds when done with development

export default async function DashboardLayout({ children }: Props) {
    const userId = await ServerComponentService.getUserId();
    const feeds = await FeedService.getAllFeedsByUserId(userId);

    if (!feeds.success) {
        console.log("no feeds found in db");
        redirect("/");
    }

    return (
        <section className="flex">
            <SideMenuContainer prefix="/dashboard" feeds={feeds.data} />
            <main className="flex-1 p-6">{children}</main>
        </section>
    );
}
