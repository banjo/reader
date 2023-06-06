import { Icons, iconSizeMapper } from "@/components/icons";
import { Size } from "@/models/size";
import { FC } from "react";

type Props = {
    filled: boolean;
    onClick: () => void;
    size?: Size;
};

export const Favorite: FC<Props> = ({ filled: filledProp, onClick, size = "md" }) => {
    const filled = filledProp ? "text-yellow-400 fill-current" : "";

    const handleClick = () => {
        onClick();
    };

    return <Icons.star className={`${iconSizeMapper[size]} ${filled}`} onClick={handleClick} />;
};
