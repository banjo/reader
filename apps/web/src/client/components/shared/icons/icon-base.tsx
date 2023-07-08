import { FC, ReactNode, useMemo } from "react";
import { Tooltip } from "@/client/components/shared/tooltip";
import { UseBoopProps, useBoop } from "@/client/hooks/animation/use-boop";
import { motion } from "framer-motion";

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
