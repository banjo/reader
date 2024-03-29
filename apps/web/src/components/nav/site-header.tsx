import { AddFeedNav } from "@/components/nav/add-feed-nav";
import { MainNav } from "@/components/nav/main-nav";
import { SettingsNav } from "@/components/nav/settings-nav";
import { Icons } from "@/components/shared/icons";
import { ResponsiveIcon } from "@/components/shared/responsive-icon";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/contexts/auth-context";
import { useMenuStore } from "@/stores/use-menu-store";

export function SiteHeader() {
    const toggleMenu = useMenuStore(state => state.toggle);

    const { userId } = useAuth();

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background">
            <div className="flex h-16 items-center px-4 md:px-8 sm:justify-between">
                <MainNav items={siteConfig.mainNav} />
                <div className="flex flex-1 items-center justify-end">
                    <nav className="flex items-center relative justify-center gap-3">
                        {userId && (
                            <>
                                <AddFeedNav />
                                <SettingsNav />
                                <ResponsiveIcon
                                    Icon={Icons.hamburger}
                                    onClick={toggleMenu}
                                    size="sm"
                                    className="md:hidden"
                                />
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
}
