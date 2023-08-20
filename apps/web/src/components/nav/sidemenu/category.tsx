import { FC, ReactNode } from "react";

type CategoryProps = {
    title: string;
    children?: ReactNode;
    isOpen?: boolean;
};

export const Category: FC<CategoryProps> = ({ title, children, isOpen }) => {
    return (
        <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 ml-4 md:ml-8">
                {title}
            </span>
            {children}
        </div>
    );
};
