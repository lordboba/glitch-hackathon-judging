import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/server/auth";
import { computeLiveLeaderboard, getPublishedLeaderboard } from "@/lib/server/leaderboard";

export async function GET(request: Request) {
  try {
    await requireSessionUser("admin");

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    const [live, published] = await Promise.all([
      computeLiveLeaderboard(eventId),
      getPublishedLeaderboard(eventId),
    ]);

    return NextResponse.json({
      live,
      published,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load leaderboard" },
      { status: 400 },
    );
  }
}
