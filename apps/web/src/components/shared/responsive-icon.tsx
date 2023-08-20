import { Tooltip } from "@/components/shared/tooltip";
import { Size } from "@/lib/size";
import { cn } from "@/lib/utils";
import { noop } from "@banjoanton/utils";
import { FC } from "react";

type FilterIconProps = {
    Icon: FC<{ className: string; onClick: () => void; disabled: boolean }>;
    tooltip?: string;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    size?: Size;
    enableTooltip?: boolean;
};

const sizeMap: Record<Size, string> = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
};

export const ResponsiveIcon: FC<FilterIconProps> = ({
    Icon,
    disabled,
    onClick = noop,
    tooltip,
    enableTooltip,
    size = "sm",
    className,
}) => {
    return (
        <Tooltip tooltip={tooltip} enabled={enableTooltip}>
            <Icon
                className={cn(
                    `${sizeMap[size]} ${
                        disabled ? "opacity-30" : "cursor-pointer hover:opacity-70 outline-none"
                    }`,
                    className
                )}
                onClick={disabled ? noop : onClick}
                disabled={disabled ?? false}
            />
        </Tooltip>
    );
};
