import { NextRequest } from "next/server";
import { getTopScores, getTotalMints, getTodayMints } from "@/lib/database";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get top scores
    const topScores = await getTopScores(limit);
    
    // Get total mints
    const totalMints = await getTotalMints();
    
    // Get today's mints
    const todayMints = await getTodayMints();

    return Response.json({
      success: true,
      data: {
        topScores,
        totalMints,
        todayMints,
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