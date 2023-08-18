import {
    Tooltip as TooltipBase,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { FC, ReactNode } from "react";

type Props = {
    tooltip?: string;
    children: ReactNode;
    enabled?: boolean;
};

export const Tooltip: FC<Props> = ({ tooltip, children, enabled = true }) => {
    if (!enabled) return <>{children}</>;

    return (
        <TooltipProvider>
            <TooltipBase>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent>
                    <p>{tooltip}</p>
                </TooltipContent>
            </TooltipBase>
        </TooltipProvider>
    );
};
