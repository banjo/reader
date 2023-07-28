import { FC, ReactNode } from "react";

import { Animated } from "@/components/shared/animated";
import { Tooltip } from "@/components/shared/tooltip";
import { BadgeProps, Badge as UiBadge } from "@/components/ui/badge";
import { HTMLMotionProps } from "framer-motion";

type Props = {
    children: ReactNode;
    tooltip: string;
    show: boolean;
    animate?: HTMLMotionProps<"div">;
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
