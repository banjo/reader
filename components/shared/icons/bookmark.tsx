import { Icons, iconSizeMapper } from "@/components/icons";
import { Size } from "@/models/size";
import { FC } from "react";

type Props = {
    filled: boolean;
    onClick: () => void;
    size?: Size;
};

export const Bookmark: FC<Props> = ({ filled: filledProp, onClick, size = "md" }) => {
    const filled = filledProp ? "fill-current" : "";

    const handleClick = () => {
        onClick();
    };

    return <Icons.bookmark className={`${iconSizeMapper[size]} ${filled}`} onClick={handleClick} />;
};
