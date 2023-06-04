import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const feed = await prisma.feed.findMany({
            include: {
                items: true,
            },
        });
        return NextResponse.json({ data: feed, success: true });
    } catch (error: any) {
        console.error("Request error", error);
        return NextResponse.json({
            error: error.message,
            success: false,
        });
    }
}
