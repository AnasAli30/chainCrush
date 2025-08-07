import { NextRequest } from "next/server";
import { getUserDailyMintCount, getUserMintHistory, getTopScores } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');

    if (!userAddress) {
      return Response.json(
        { success: false, error: "Missing userAddress parameter" },
        { status: 400 }
      );
    }

    // Get user's daily mint count
    const dailyMintCount = await getUserDailyMintCount(userAddress);
    
    // Get user's mint history
    const mintHistory = await getUserMintHistory(userAddress, 10);
    
    // Get top scores
    const topScores = await getTopScores(10);

    return Response.json({
      success: true,
      data: {
        userAddress,
        dailyMintCount,
        mintHistory,
        topScores,
        dailyMintsRemaining: 5 - dailyMintCount
      }
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    return Response.json(
      { success: false, error: "Failed to get user stats" },
      { status: 500 }
    );
  }
} 