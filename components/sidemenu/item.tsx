import { IconType } from "@/components/icons";
import Link from "next/link";
import { FC, ReactNode } from "react";

type ItemProps = {
    title: string;
    Icon: IconType;
    url: string;
    selected: boolean;
    highlight?: boolean;
    notification?: ReactNode;
};

export const Item: FC<ItemProps> = ({
    title,
    Icon,
    notification,
    url,
    selected = false,
    highlight = false,
}) => {
    const selectedClasses = selected
        ? "bg-slate-100 dark:bg-slate-800"
        : "hover:bg-slate-50 dark:hover:bg-slate-900";

    const highlightClasses = highlight ? "font-semibold" : "";

    console.log(url);

    return (
        <Link
            href={url}
            className={`flex h-10 w-72 cursor-pointer items-center justify-between gap-4 rounded
         px-4 text-foreground
         ${selectedClasses}
         ${highlightClasses}
         `}
        >
            <div className="flex items-center gap-4">
                <Icon className="h-5 w-5" />
                <span className="text-md">{title}</span>
            </div>
            {notification}
        </Link>
    );
};
