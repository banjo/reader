import {
    Tooltip as TooltipBase,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { FC, ReactNode } from "react";

type Props = {
    tooltip: string;
    children: ReactNode;
};

export const Tooltip: FC<Props> = ({ tooltip, children }) => {
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
