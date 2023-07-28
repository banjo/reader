import { Badge } from "@/components/shared/badge";
import { IconType } from "@/components/shared/icons";
import { FC, ReactNode } from "react";
import { Link } from "react-router-dom";

type ItemProps = {
    title: string;
    Icon?: IconType;
    image?: string | null;
    url: string;
    selected: boolean;
    highlight?: boolean;
    notification?: ReactNode;
    notificationTooltip: string;
};

export const Item: FC<ItemProps> = ({
    title,
    Icon,
    notification,
    notificationTooltip,
    url,
    image,
    selected = false,
    highlight = false,
}) => {
    const selectedClasses = selected
        ? "bg-slate-100 dark:bg-slate-800"
        : "hover:bg-slate-50 dark:hover:bg-slate-900";

    const highlightClasses = highlight ? "font-semibold" : "";

    return (
        <Link
            to={url}
            className={`flex h-10 w-72 cursor-pointer items-center justify-between gap-4 rounded
            px-4 text-foreground
            ${selectedClasses}
            ${highlightClasses}
            `}
        >
            <div className="flex items-center gap-4">
                {Icon && <Icon className="h-5 w-5" />}
                {image && <img src={image} className="h-5 w-5 rounded-full" />}
                <span className="text-md">{title}</span>
            </div>

            <Badge show={Boolean(notification)} tooltip={notificationTooltip}>
                {notification}
            </Badge>
        </Link>
    );
};
