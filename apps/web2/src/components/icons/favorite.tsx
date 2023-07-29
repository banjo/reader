import { IconBase } from "@/components/icons/icon-base";
import { Icons, iconSizeMapper } from "@/components/shared/icons";
import { Size } from "@/lib/size";
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
        <IconBase
            boopOnClick={true}
            boopProps={{
                rotation: 40,
                transitionConfig: {
                    type: "spring",
                    stiffness: 250,
                },
            }}
            tooltip={tooltip}
        >
            <Icons.star className={`${iconSizeMapper[size]} ${color}`} onClick={handleClick} />
        </IconBase>
    );
};
