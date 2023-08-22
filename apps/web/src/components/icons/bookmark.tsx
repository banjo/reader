import { IconBase } from "@/components/icons/icon-base";
import { Icons } from "@/components/shared/icons";
import { FC } from "react";

type Props = {
    active: boolean;
    onClick: () => void;
    className?: string;
};

export const Bookmark: FC<Props> = ({ active, onClick, className }) => {
    const filled = active ? "fill-current" : "";
    const tooltip = active ? "Remove from read later" : "Read later";

    const handleClick = () => {
        onClick();
    };

    return (
        <IconBase tooltip={tooltip}>
            <Icons.bookmark className={`${className} ${filled}`} onClick={handleClick} />
        </IconBase>
    );
};
