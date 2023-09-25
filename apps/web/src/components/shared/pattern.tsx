import { getPattern } from "@/utils/pattern";
import { useEffect, useRef } from "react";

type Props = {
    name: string;
    className?: string;
};

export const Pattern = ({ name, className }: Props) => {
    const patternRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (patternRef.current) {
            const patternUrl = getPattern(name);
            patternRef.current.style.backgroundImage = patternUrl;
        }
    }, [name]);

    return <div ref={patternRef} className={className} />;
};
