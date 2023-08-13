import { MainNav } from "@/components/nav/main-nav";
import { siteConfig } from "@/config/site";
import { useMenuStore } from "@/stores/useMenuStore";
import { UserButton } from "@clerk/clerk-react";
import Hamburger from "hamburger-react";

export function SiteHeader() {
    const isOpen = useMenuStore(state => state.isOpen);
    const toggleMenu = useMenuStore(state => state.toggle);

    return (
        <header className="top-0 z-40 w-full border-b bg-background">
            <div className="flex h-16 items-center space-x-4 px-4 md:px-8 sm:justify-between sm:space-x-0">
                <MainNav items={siteConfig.mainNav} />
                <div className="flex flex-1 items-center justify-end space-x-4">
                    <nav className="flex items-center space-x-1 relative">
                        <div className="h-8 w-8 mr-16 md:mr-0">
                            <UserButton afterSignOutUrl="/" />
                        </div>

                        <div className="pl-4 absolute left-5 z-50 md:hidden">
                            <Hamburger onToggle={toggleMenu} toggled={isOpen} />
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    );
}
