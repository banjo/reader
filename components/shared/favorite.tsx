import { Icons } from "@/components/icons";
import { Size } from "@/models/size";
import { FC } from "react";

type Props = {
    filled: boolean;
    onClick: () => void;
    size?: Size;
};

const mapper: Record<Size, string> = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
};

export const Favorite: FC<Props> = ({ filled: filledProp, onClick, size = "md" }) => {
    const filled = filledProp ? "text-yellow-400 fill-current" : "";

    return <Icons.star className={`${mapper[size]} ${filled}`} />;
};
