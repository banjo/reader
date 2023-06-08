import { Tooltip } from "@/client/components/shared/tooltip";
import { useBoop } from "@/client/hooks/animation/useBoop";
import { motion } from "framer-motion";
import { FC, ReactNode } from "react";

type Props = {
    tooltip: string;
    children: ReactNode;
};

export const IconBase: FC<Props> = ({ tooltip, children }) => {
    const [isBooped, variants, trigger] = useBoop({
        rotation: 5,
        timing: 150,
    });

    return (
        <motion.div onMouseEnter={trigger} animate={isBooped ? "boop" : "rest"} variants={variants}>
            <Tooltip tooltip={tooltip}>{children}</Tooltip>
        </motion.div>
    );
};
