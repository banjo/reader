import { FC, ReactNode, useEffect } from "react";

type Props = {
    isOpen: boolean;
    children: ReactNode;
    closeButton?: ReactNode;
};

export const SideMenu: FC<Props> = ({ children, isOpen, closeButton }) => {
    // Prevent scrolling when the menu is open
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "auto";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    return (
        <aside
            className={`md:relative md:h-screen md:w-80 md:border-r bg-background dark:bg-background
                w-full h-full absolute inset-0 z-40 
                px-4 md:px-0
                py-8 md:py-4
                pt-16
                overflow-y-scroll
                transform transition-transform ease-in-out
                md:transform-none md:duration-0
                ${isOpen ? "duration-500" : "-translate-y-[120%] md:translate-y-0"}
                
        `}
        >
            {closeButton}
            <div className="relative">{children}</div>
        </aside>
    );
};
