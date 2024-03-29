import { Dropdown } from "@/components/shared/dropdown";
import { DropdownRow } from "@/components/shared/dropdown-row";
import { Icons } from "@/components/shared/icons";
import { ResponsiveIcon } from "@/components/shared/responsive-icon";
import { useAuth } from "@/contexts/auth-context";
import { useAddFeed } from "@/hooks/backend/use-add-feed";
import { useInvalidate } from "@/hooks/backend/use-invalidate";
import { useGlobalLoadingStore } from "@/stores/use-global-loading-store";
import { parseOpmlRssSubscriptions } from "@/utils/opml";
import { selectFile } from "@/utils/reader";
import { noop } from "@banjoanton/utils";
import { FC } from "react";
import { toast } from "react-hot-toast";

export const SettingsNav: FC = () => {
    const { addMany } = useAddFeed();
    const { invalidate, clear } = useInvalidate();
    const { logout } = useAuth();
    const setIsGlobalLoading = useGlobalLoadingStore(state => state.setIsLoading);

    const { userId } = useAuth();

    const signOut = async () => {
        await logout();
        clear();
    };

    const handleFile = async (file: File) => {
        const subs = await parseOpmlRssSubscriptions(file);

        setIsGlobalLoading(true, "Importing OPML...");
        const res = await addMany(subs);
        setIsGlobalLoading(false);

        if (!res.success) {
            toast.error("Failed to import OPML");
            return;
        }

        if (res.data.errors.length > 0) {
            const failedAmount = res.data.errors.length;
            toast.error(`Failed to import ${failedAmount} OPML feeds`);
            return;
        }

        await invalidate();

        toast.success(`Successfully imported ${subs.length} OPML feeds`);
    };

    return (
        <>
            {userId && (
                <div className="flex items-center justify-center">
                    <Dropdown
                        align="start"
                        side="bottom"
                        item={{}}
                        containerClasses="w-36"
                        menuEntries={[
                            {
                                type: "label",
                                label: "Settings",
                            },
                            {
                                type: "separator",
                            },
                            {
                                onSelect: () => {
                                    selectFile({
                                        accept: ".opml",
                                        multiple: false,
                                        handleFile,
                                    });
                                },
                                type: "select",
                                content: <DropdownRow icon={Icons.fileUp} text="Import" />,
                            },
                            {
                                content: <DropdownRow icon={Icons.signOut} text="Sign out" />,
                                type: "select",
                                onSelect: signOut,
                            },
                        ]}
                    >
                        <div className="flex cursor-pointer items-center justify-center">
                            <ResponsiveIcon
                                Icon={Icons.horizontalMenu}
                                tooltip="Settings"
                                onClick={noop}
                                size="sm"
                            />
                        </div>
                    </Dropdown>
                </div>
            )}
        </>
    );
};
