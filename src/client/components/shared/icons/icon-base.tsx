import { Tooltip } from "@/client/components/shared/tooltip";
import { useBoop, UseBoopProps } from "@/client/hooks/animation/useBoop";
import { motion } from "framer-motion";
import { FC, ReactNode, useMemo } from "react";

type Props = {
    tooltip: string;
    children: ReactNode;
    boopOnHover?: boolean;
    boopOnClick?: boolean;
    boopProps?: UseBoopProps;
};

export const IconBase: FC<Props> = ({
    tooltip,
    children,
    boopOnHover,
    boopOnClick,
    boopProps = {},
}) => {
    const [isBooped, variants, trigger] = useBoop(boopProps);

    const animate = useMemo(() => {
        if (boopOnHover && isBooped) {
            return "boop";
        } else if (boopOnClick && isBooped) {
            return "boop";
        }

        return "rest";
    }, [boopOnClick, boopOnHover, isBooped]);

    return (
        <motion.div onClick={trigger} animate={animate} variants={variants}>
            <Tooltip tooltip={tooltip}>{children}</Tooltip>
        </motion.div>
    );
};
