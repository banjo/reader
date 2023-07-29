import { MainNav } from "@/components/nav/main-nav";
import { Icons } from "@/components/shared/icons";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export function SiteHeader() {
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background">
            <div className="flex h-16 items-center space-x-4 px-8 sm:justify-between sm:space-x-0">
                <MainNav items={siteConfig.mainNav} />
                <div className="flex flex-1 items-center justify-end space-x-4">
                    <nav className="flex items-center space-x-1">
                        <Link to={siteConfig.links.github} target="_blank" rel="noreferrer">
                            <div
                                className={buttonVariants({
                                    size: "sm",
                                    variant: "ghost",
                                })}
                            >
                                <Icons.gitHub className="h-5 w-5" />
                                <span className="sr-only">GitHub</span>
                            </div>
                        </Link>
                        <Link to={siteConfig.links.twitter} target="_blank" rel="noreferrer">
                            <div
                                className={buttonVariants({
                                    size: "sm",
                                    variant: "ghost",
                                })}
                            >
                                <Icons.twitter className="h-5 w-5 fill-current" />
                                <span className="sr-only">Twitter</span>
                            </div>
                        </Link>
                        {/* <ThemeToggle /> */}

                        <div className="h-8 w-8 pl-4">
                            <UserButton afterSignOutUrl="/" />
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    );
}
