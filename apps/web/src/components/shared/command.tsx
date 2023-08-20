import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { FC, ReactNode } from "react";

export type ResultType = {
    id: string;
    text: string;
    value: string;
    icon: ReactNode;
};

type CommandProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    results: ResultType[];
    handleSelected: (selected: ResultType) => void;
    inputText: string;
    notFoundText: string;
    headingText: string;
    isLoading?: boolean;
    handleInputChange?: (search: string) => void;
};

export const Command: FC<CommandProps> = ({
    isOpen,
    setIsOpen,
    results,
    inputText,
    notFoundText,
    handleInputChange,
    handleSelected,
    headingText,
    isLoading,
}) => {
    return (
        <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
            <CommandInput placeholder={inputText} onValueChange={handleInputChange} />

            <CommandList>
                {results.length === 0 && <CommandEmpty>{notFoundText}</CommandEmpty>}
                {results.length > 0 && (
                    <CommandGroup heading={headingText}>
                        {results.map(result => (
                            <CommandItem
                                key={result.text}
                                onSelect={() => {
                                    handleSelected(result);
                                }}
                            >
                                {result.icon}
                                <span>{result.text}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </CommandDialog>
    );
};
