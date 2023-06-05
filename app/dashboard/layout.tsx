import { SideMenuContainer } from "@/components/sidemenu/side-menu-container";
import { FeedRepository } from "@/server/repositories/FeedRepository";
import { UserRepository } from "@/server/repositories/UserRepository";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

type Props = {
    children: React.ReactNode;
};

export default async function DashboardLayout({ children }: Props) {
    const { userId: externalUserId } = auth();

    if (!externalUserId) {
        redirect("/");
    }

    const userId = await UserRepository.getIdByExternalId(externalUserId);

    if (!userId.success) {
        console.log("no user id found in db");
        redirect("/");
    }

    const feeds = await FeedRepository.getAllUserFeeds(userId.data);

    if (!feeds.success) {
        console.log("no feeds found in db");
        redirect("/");
    }

    return (
        <section className="flex">
            <SideMenuContainer prefix="/dashboard" feeds={feeds.data} />
            <main className="p-16">{children}</main>
        </section>
    );
}
