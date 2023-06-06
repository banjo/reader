import { TableContainer } from "@/components/table/table-container";
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

    return (
        <div className="flex flex-col gap-4">
            {feed.name}
            <TableContainer feed={feed} multipleFeeds={false} />
            <div></div>
        </div>
    );
}
