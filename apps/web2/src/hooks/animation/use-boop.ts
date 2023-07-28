import { useCallback, useEffect, useState } from "react";
import { Variants } from "framer-motion";

export type UseBoopProps = {
    x?: number;
    y?: number;
    rotation?: number;
    scale?: number;
    timing?: number;
    transitionConfig?: {
        type: "spring" | "tween";
        stiffness?: number;
        damping?: number;
    };
};

export const useBoop = ({
    x = 0,
    y = 0,
    rotation = 0,
    scale = 1,
    timing = 150,
    transitionConfig = {
        type: "spring",
        stiffness: 300,
        damping: 10,
    },
}: UseBoopProps): [boolean, Variants, () => void] => {
    const [isBooped, setIsBooped] = useState(false);
    const variants = {
        boop: {
            translateX: x,
            translateY: y,
            rotate: rotation,
            scale: scale,
            transition: transitionConfig,
        },
        rest: {
            rotate: 0,
            scale: 1,
        },
    };
    useEffect(() => {
        if (!isBooped) return;

        const timeoutId = window.setTimeout(() => {
            setIsBooped(false);
        }, timing);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [isBooped, timing]);

    const trigger = useCallback(() => {
        setIsBooped(true);
    }, []);

    return [isBooped, variants, trigger];
};
