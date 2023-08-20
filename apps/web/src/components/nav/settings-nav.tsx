import { Dropdown } from "@/components/shared/dropdown";
import { Icons } from "@/components/shared/icons";
import { ResponsiveIcon } from "@/components/shared/responsive-icon";
import { useAddFeed } from "@/hooks/backend/use-add-feed";
import { useAuth } from "@/hooks/backend/use-auth";
import { useInvalidate } from "@/hooks/backend/use-invalidate";
import { parseOpmlRssSubscriptions } from "@/utils/opml";
import { selectFile } from "@/utils/reader";
import { noop } from "@banjoanton/utils";
import { FC } from "react";
import { toast } from "react-hot-toast";

export const SettingsNav: FC = () => {
    const { addMany } = useAddFeed();
    const { invalidate } = useInvalidate();
    const { userId } = useAuth();

    return (
        <>
            {userId && (
                <div className="flex items-center justify-center">
                    <Dropdown
                        align="start"
                        side="bottom"
                        item={{}}
                        menuEntries={[
                            {
                                onSelect: () => {
                                    selectFile({
                                        accept: ".opml",
                                        multiple: false,
                                        handleFile: async file => {
                                            const subs = await parseOpmlRssSubscriptions(file);

                                            const res = await addMany(subs);

                                            if (!res.success) {
                                                toast.error("Failed to import OPML");
                                                return;
                                            }

                                            if (res.data.errors.length > 0) {
                                                const failedAmount = res.data.errors.length;
                                                toast.error(
                                                    `Failed to import ${failedAmount} OPML feeds`
                                                );
                                                return;
                                            }

                                            await invalidate();

                                            toast.success(
                                                `Successfully imported ${subs.length} OPML feeds`
                                            );
                                        },
                                    });
                                },
                                type: "select",
                                content: "Import OPML",
                            },
                        ]}
                    >
                        <div className="flex cursor-pointer items-center justify-center">
                            <ResponsiveIcon
                                Icon={Icons.settings}
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
