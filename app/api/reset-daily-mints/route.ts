import { NextRequest } from "next/server";
import { resetDailyMintStatus } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    // Reset daily mint status for all users
    await resetDailyMintStatus();

    return Response.json({
      success: true,
      message: "Daily mint status reset successfully"
    });
  } catch (error) {
    console.error("Error resetting daily mint status:", error);
    return Response.json(
      { success: false, error: "Failed to reset daily mint status" },
      { status: 500 }
    );
  }
}
