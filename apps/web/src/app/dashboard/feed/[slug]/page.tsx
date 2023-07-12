import { ClientAuthContainer } from "@/client/components/utils/client-auth-container";
import { FeedContainer } from "@/client/features/feed/containers/feed-container";
import { ServerComponentService } from "@/server/services/ServerComponentService";
import { CleanFeedWithContent, CleanFeedWithItems } from "db";
import { AsyncResultType, FeedService, Result } from "server";

type Props = {
    params: {
        slug: string;
    };
};

export const revalidate = 0;

const fetchFeed = async (
    slug: string
): AsyncResultType<CleanFeedWithItems | CleanFeedWithContent> => {
    const userId = await ServerComponentService.getUserId();

    if (!slug) {
        return Result.error("Could not get internal identifier", "BadRequest");
    }

    const feedResult = await FeedService.getFeedWithItemsOrContent(slug, userId);

    if (!feedResult.success) {
        return Result.error(feedResult.message, feedResult.type);
    }

    return Result.ok(feedResult.data);
};

export default async function FeedPage({ params }: Props) {
    const { slug } = params;
    const res = await fetchFeed(slug);

    if (!res.success) {
        return <div>Could not fetch</div>; // TODO: Error page
    }

    return (
        <ClientAuthContainer>
            <FeedContainer feed={res.data} internalIdentifier={slug} />
        </ClientAuthContainer>
    );
}
