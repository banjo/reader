import { Icons } from "@/components/shared/icons";
import { Input as InputComponent } from "@/components/ui/input";
import { FC } from "react";

type Props = {
    test?: boolean;
};

export const Input: FC<Props> = () => {
    return (
        <div className="flex items-center gap-2">
            <InputComponent className="ml-8 flex h-10 w-56" placeholder="Feed URL..." />
            <button type="button" className="ml-2 hover:text-slate-400 ">
                <Icons.add className="h-6 w-6" />
            </button>
        </div>
    );
};
