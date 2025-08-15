import { NextRequest } from "next/server";
import { getAllTimeHighLeaderboard } from "@/lib/database";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get all-time high leaderboard
    const leaderboard = await getAllTimeHighLeaderboard(limit);

    return Response.json({
      success: true,
      data: {
        leaderboard,
        limit
      }
    });
  } catch (error) {
    console.error("Error getting ATH leaderboard:", error);
    return Response.json(
      { success: false, error: "Failed to get ATH leaderboard" },
      { status: 500 }
    );
  }
}
