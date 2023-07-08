import { FC } from "react";
import { Icons, iconSizeMapper } from "@/client/components/shared/icons";
import { IconBase } from "@/client/components/shared/icons/icon-base";
import { Size } from "@/shared/models/size";

type Props = {
    active: boolean;
    onClick: () => void;
    size?: Size;
};

export const Bookmark: FC<Props> = ({ active, onClick, size = "md" }) => {
    const filled = active ? "fill-current" : "";
    const tooltip = active ? "Remove from read later" : "Read later";

    const handleClick = () => {
        onClick();
    };

    return (
        <IconBase tooltip={tooltip}>
            <Icons.bookmark
                className={`${iconSizeMapper[size]} ${filled}`}
                onClick={handleClick}
            />
        </IconBase>
    );
};
