import { IconBase } from "@/components/icons/icon-base";
import { Icons } from "@/components/shared/icons";
import { FC } from "react";

type Props = {
    active: boolean;
    onClick: () => void;
    className?: string;
};

export const Favorite: FC<Props> = ({ active, onClick, className }) => {
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
            <Icons.star className={`${className} ${color}`} onClick={handleClick} />
        </IconBase>
    );
};
