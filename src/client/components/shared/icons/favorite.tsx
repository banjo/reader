import { Icons, iconSizeMapper } from "@/client/components/shared/icons";
import { IconBase } from "@/client/components/shared/icons/icon-base";
import { Size } from "@/models/size";
import { FC } from "react";

type Props = {
    active: boolean;
    onClick: () => void;
    size?: Size;
};

export const Favorite: FC<Props> = ({ active, onClick, size = "md" }) => {
    const color = active ? "text-yellow-400 fill-current" : "";
    const tooltip = active ? "Remove from favorites" : "Mark as favorite";

    const handleClick = () => {
        onClick();
    };

    return (
        <IconBase tooltip={tooltip}>
            <Icons.star className={`${iconSizeMapper[size]} ${color}`} onClick={handleClick} />
        </IconBase>
    );
};
