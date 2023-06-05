import { NextResponse } from "next/server";
import { FeedRepository } from "../../../repositories/FeedRepository";
import { RequestService } from "../../../services/RequestService";

export async function GET(req: Request) {
    const userId = RequestService.getUserId(req);

    const feed = await FeedRepository.getAllUserFeeds(userId);

    if (!feed.success) {
        return NextResponse.error();
    }

    return NextResponse.json({ data: feed.data });
}
