import { Size } from "@/src/models/size";
import { FC } from "react";

type Props = {
    size: Size;
};

const mapper: Record<Size, string> = {
    sm: "mb-2",
    md: "mb-4",
    lg: "mb-8",
};

export const Divider: FC<Props> = ({ size }) => {
    return <div className={mapper[size]} />;
};
