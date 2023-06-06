import { TableItem } from "@/components/table/table-item";
import { FeedRepository } from "@/server/repositories/FeedRepository";

type Props = {
    params: {
        slug: string;
    };
};

export const revalidate = 0;

export default async function FeedPage({ params }: Props) {
    const slug = params.slug;

    if (!slug) {
        return <div>invalid feed id</div>; // TODO: create error page
    }

    // const userId = await ServerComponentService.getUserId(); // TODO: check if user has access to feed
    const feedResponse = await FeedRepository.getFeedByPublicUrl(slug);

    if (!feedResponse.success) {
        console.log("no feed found in db");
        return <div>feed not found</div>; // TODO: create error page
    }

    const feed = feedResponse.data;

    if (!feed.items) {
        console.log("Feed not included in database response");
        return <div>feed not found</div>; // TODO: create error page
    }

    return (
        <div className="flex flex-col gap-4">
            {feed.name}
            <div className="flex flex-col gap-2">
                {feed.items.map(item => {
                    return <TableItem key={item.id} item={item} type={"list"} />;
                })}
            </div>
            <div></div>
        </div>
    );
}
