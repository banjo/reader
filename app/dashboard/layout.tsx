import { SideMenuContainer } from "@/components/sidemenu/side-menu-container";

type Props = {
    children: React.ReactNode;
};

export default function DashboardLayout({ children }: Props) {
    return (
        <section className="flex">
            <SideMenuContainer prefix="/dashboard" />
            <main className="p-16">{children}</main>
        </section>
    );
}
