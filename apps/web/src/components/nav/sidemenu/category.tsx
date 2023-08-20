import { Icons } from "@/components/shared/icons";
import { ResponsiveIcon } from "@/components/shared/responsive-icon";
import { FC, ReactNode, useState } from "react";

type CategoryProps = {
    title: string;
    children?: ReactNode;
    defaultIsOpen?: boolean;
};

export const Category: FC<CategoryProps> = ({ title, children, defaultIsOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultIsOpen);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div>
            <div className="flex justify-between items-center" onClick={toggleOpen}>
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 ml-4 md:ml-8 cursor-pointer">
                    {title}
                </span>
                <ResponsiveIcon
                    Icon={Icons.chevronDown}
                    className={`mr-8 hidden md:block
                    transition-transform duration-500 ease-in-out
                    text-slate-400
                    ${isOpen ? "rotate-180" : ""}`}
                />
            </div>

            {/* Desktop */}
            <div
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                className="transition-['grid-template-rows'] duration-500 ease-in-out hidden md:grid"
            >
                <div className="overflow-hidden">{children}</div>
            </div>

            {/* Mobile */}
            <div className="md:hidden">{children}</div>
        </div>
    );
};
