import { FC } from "react";

type CategoryProps = {
    title: string;
};

export const Category: FC<CategoryProps> = ({ title }) => {
    return (
        <div className="mb-1 flex items-center justify-between pl-4 md:pl-8 pr-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
            {title}
        </div>
    );
};
