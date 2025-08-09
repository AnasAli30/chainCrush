import { NextRequest } from "next/server";
import { getTotalPlayersCount } from "@/lib/database";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get total unique players count from database
    const totalPlayers = await getTotalPlayersCount();

    return Response.json({
      success: true,
      data: {
        totalPlayers
      }
    });
  } catch (error) {
    console.error("Error getting total players count:", error);
    return Response.json(
      { success: false, error: "Failed to get total players count" },
      { status: 500 }
    );
  }
}
