import { NextRequest } from "next/server";
import { getMixedLeaderboard, getTotalPlayersCount } from "@/lib/database";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get total unique players count from database
    const total = await getTotalPlayersCount();
    
    // Get paginated leaderboard data
    const leaderboard = await getMixedLeaderboard(limit, offset);
    
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
    console.error("Error getting leaderboard:", error);
    return Response.json(
      { success: false, error: "Failed to get leaderboard" },
      { status: 500 }
    );
  }
}

