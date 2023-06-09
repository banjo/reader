import { FeedContainer } from "@/client/features/feed/containers/feed-container";
import { FeedService } from "@/server/services/FeedService";
import { ServerComponentService } from "@/server/services/ServerComponentService";

type Props = {
    params: {
        slug: string;
    };
};

export const revalidate = 0;

export default async function FeedPage({ params }: Props) {
    const userId = await ServerComponentService.getUserId();

    const feed = await FeedService.getAllFeedsByUserId(userId);

    if (!feed.success) {
        return <div>Something went wrong</div>; // TODO: create error page
    }

    const slug = params.slug;

    if (!slug) {
        return <div>invalid feed id</div>; // TODO: create error page
    }

    const hasAccess = feed.data.some(f => f.internalIdentifier === slug);

    if (!hasAccess) {
        return <div>User does not have access</div>; // TODO: create error page
    }

    const feedResponse = await FeedService.getFeedByInternalIdentifier(slug, userId);

    if (!feedResponse.success) {
        return <div>invalid feed id</div>; // TODO: create error page
    }

    return <FeedContainer feed={feedResponse.data} internalIdentifier={slug} />;
}
