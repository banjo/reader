import { NextResponse } from "next/server";
import { UserRepository } from "@/server/repositories/UserRepository";

export async function GET(req: Request) {
    const headers = new Headers(req.headers);
    const externalId = headers.get("X-External-User-Id");

    if (!externalId) {
        return NextResponse.json({ userId: null });
    }

    const userId = await UserRepository.getIdByExternalId(externalId);

    if (!userId.success) {
        return NextResponse.json({ userId: null });
    }

    headers.set("X-User-Id", userId.data.toString());

    return NextResponse.json({ userId: userId.data });
}
