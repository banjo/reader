import { Badge } from "@/components/shared/badge";
import { IconType } from "@/components/shared/icons";
import { Tooltip } from "@/components/shared/tooltip";
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
    onClick?: () => void;
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
    onClick,
}) => {
    const selectedClasses = selected
        ? "bg-slate-100 dark:bg-slate-800"
        : "hover:bg-slate-50 dark:hover:bg-slate-900";

    const highlightClasses = highlight ? "font-semibold" : "";

    return (
        <Link
            to={url}
            onClick={onClick}
            className={`flex relative h-16 md:h-10 w-full md:w-72 cursor-pointer items-center justify-between gap-4 rounded
            px-8 md:px-6 text-foreground
            ${selectedClasses}
            ${highlightClasses}
            `}
        >
            <div className="flex items-center gap-4 relative overflow-hidden">
                <div className="w-8 h-8 md:h-5 md:w-5">
                    {Icon && <Icon className="w-8 h-8 md:h-5 md:w-5" />}
                    {image && <img src={image} className="h-8 w-8 md:h-5 md:w-5" />}
                </div>
                <Tooltip tooltip={title}>
                    <span className="text-2xl md:text-sm truncate w-full md:w-36">{title}</span>
                </Tooltip>
            </div>

            <Badge
                className="transform mr-4 md:mr-0 scale-150 md:scale-100"
                show={Boolean(notification)}
                tooltip={notificationTooltip}
            >
                {notification}
            </Badge>
        </Link>
    );
};
