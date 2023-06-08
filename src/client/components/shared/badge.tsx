import { Animated } from "@/client/components/shared/animated";
import { Tooltip } from "@/client/components/shared/tooltip";
import { BadgeProps, Badge as UiBadge } from "@/client/components/ui/badge";
import { HTMLMotionProps } from "framer-motion";
import { FC, ReactNode } from "react";

type Props = {
    children: ReactNode;
    tooltip: string;
    show: boolean;
    animate: HTMLMotionProps<"div">;
} & BadgeProps;

export const Badge: FC<Props> = ({ children, tooltip, show, animate, ...props }) => {
    return (
        <Animated show={show} {...animate}>
            <Tooltip tooltip={tooltip}>
                <div>
                    <UiBadge {...props}>{children}</UiBadge>
                </div>
            </Tooltip>
        </Animated>
    );
};
