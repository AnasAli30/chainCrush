import { NextRequest } from "next/server";
import { getAllTimeHighLeaderboard, getTotalAthPlayersCount } from "@/lib/database";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get total ATH players count
    const total = await getTotalAthPlayersCount();
    
    // Get paginated ATH leaderboard
    const leaderboard = await getAllTimeHighLeaderboard(limit, offset);
    
    // Check if there are more items available
    const hasMore = offset + limit < total;

    return Response.json({
      success: true,
      data: {
        leaderboard,
        limit,
        offset,
        hasMore,
        total
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
