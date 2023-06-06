import { Tooltip } from "@/components/shared/Tooltip";
import { FC, ReactNode } from "react";

type Props = {
    tooltip: string;
    children: ReactNode;
};

export const IconBase: FC<Props> = ({ tooltip, children }) => {
    return <Tooltip tooltip={tooltip}>{children}</Tooltip>;
};
