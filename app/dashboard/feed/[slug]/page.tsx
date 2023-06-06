import { FeedContainer } from "@/components/features/feed/containers/feed-container";
import { FeedService } from "@/server/services/FeedService";

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

    const feedResponse = await FeedService.getFeedByPublicUrl(slug);

    if (!feedResponse.success) {
        return <div>invalid feed id</div>; // TODO: create error page
    }

    return <FeedContainer feed={feedResponse.data} publicUrl={slug} />;
}
