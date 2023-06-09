import Link from "next/link";

import { Icons } from "@/client/components/shared/icons";
import { siteConfig } from "@/client/config/site";
import { cn } from "@/client/lib/utils";
import { NavItem } from "@/client/types/nav";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

interface MainNavProps {
    items?: NavItem[];
}

export function MainNav({ items }: MainNavProps) {
    const { userId } = useAuth();

    const linksToRender = useMemo(() => {
        return items?.filter(item => {
            if (item.public) return true;

            return !!userId;
        });
    }, [items, userId]);

    return (
        <div className="flex gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
                <Icons.logo className="h-6 w-6" />
                <span className="inline-block font-bold">{siteConfig.name}</span>
            </Link>

            <nav className="flex gap-6">
                {linksToRender?.map((item, index) => (
                    <Link
                        key={index}
                        href={item.href}
                        className={cn(
                            "flex items-center text-sm font-medium text-muted-foreground",
                            item.disabled && "cursor-not-allowed opacity-80"
                        )}
                    >
                        {item.title}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
