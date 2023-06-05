import { SideMenuContainer } from "@/components/sidemenu/side-menu-container";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function IndexPage() {
    const { userId } = auth();

    if (!userId) {
        redirect("/");
    }

    return (
        <section className="flex">
            <SideMenuContainer />
            <main className="px-16">main</main>
        </section>
    );
}
