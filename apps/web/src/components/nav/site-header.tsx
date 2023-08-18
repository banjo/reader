import { MainNav } from "@/components/nav/main-nav";
import { SettingsNav } from "@/components/nav/settings-nav";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/hooks/backend/use-auth";
import { useMenuStore } from "@/stores/useMenuStore";
import { UserButton } from "@clerk/clerk-react";
import Hamburger from "hamburger-react";

export function SiteHeader() {
    const isOpen = useMenuStore(state => state.isOpen);
    const toggleMenu = useMenuStore(state => state.toggle);

    const { userId } = useAuth();

    return (
        <header className="top-0 z-40 w-full border-b bg-background">
            <div className="flex h-16 items-center px-4 md:px-8 sm:justify-between">
                <MainNav items={siteConfig.mainNav} />
                <div className="flex flex-1 items-center justify-end">
                    <nav className="flex items-center relative justify-center">
                        {userId && <SettingsNav />}

                        <div className="h-8 w-8 mr-16 md:mr-0">
                            <UserButton afterSignOutUrl="/" />
                        </div>

                        {userId && (
                            <div className="pl-4 absolute left-16 z-50 md:hidden">
                                <Hamburger onToggle={toggleMenu} toggled={isOpen} />
                            </div>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
}
