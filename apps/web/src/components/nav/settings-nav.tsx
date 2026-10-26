import { Dropdown } from "@/components/shared/dropdown";
import { DropdownRow } from "@/components/shared/dropdown-row";
import { Icons } from "@/components/shared/icons";
import { ResponsiveIcon } from "@/components/shared/responsive-icon";
import { useAuth } from "@/contexts/auth-context";
import { FeedImportProgress } from "./feed-import-progress";
import { useAddFeed } from "@/hooks/backend/use-add-feed";
import { useInvalidate } from "@/hooks/backend/use-invalidate";
import { parseOpmlRssSubscriptions } from "@/utils/opml";
import { selectFile } from "@/utils/reader";
import { noop } from "@banjoanton/utils";
import { FC } from "react";
import { toast } from "react-hot-toast";
import { feedImportLimit } from "model";

export const SettingsNav: FC = () => {
    const { addMany, isQueuing, importId, progress, dismiss } = useAddFeed();
    const { clear } = useInvalidate();
    const { logout } = useAuth();

    const { userId } = useAuth();

    const signOut = async () => {
        await logout();
        clear();
    };

    const handleFile = async (file: File) => {
        try {
            const subs = await parseOpmlRssSubscriptions(file);
            if (!subs.length || subs.length > feedImportLimit) {
                toast.error(`Choose an OPML file with 1–${feedImportLimit} feeds`);
                return;
            }
            await addMany(subs);
        } catch {
            toast.error("Could not queue the import. Check the OPML file and try again.");
        }
    };

    return (
        <>
            {importId ? (
                <FeedImportProgress
                    status={progress.data}
                    hasError={progress.isError}
                    dismiss={dismiss}
                />
            ) : null}
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
                                disabled:
                                    isQueuing || Boolean(importId && !progress.data?.finished),
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
