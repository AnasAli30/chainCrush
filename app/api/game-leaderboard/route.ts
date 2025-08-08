import { NextRequest } from "next/server";
import { getLeaderboard } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get leaderboard
    const leaderboard = await getLeaderboard(limit);

    return Response.json({
      success: true,
      data: {
        leaderboard,
        limit
      }
    });
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    return Response.json(
      { success: false, error: "Failed to get leaderboard" },
      { status: 500 }
    );
  }
}

