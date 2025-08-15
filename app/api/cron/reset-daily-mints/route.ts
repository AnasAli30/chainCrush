import { NextRequest } from "next/server";
import { resetDailyMintStatus } from "@/lib/database";

// Vercel cron job configuration
export const runtime = 'edge';

// This endpoint will be called automatically by Vercel cron
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('🕛 Starting daily mint reset...');
    
    // Reset daily mint status for all users
    await resetDailyMintStatus();
    
    console.log('✅ Daily mint reset completed successfully');

    return Response.json({
      success: true,
      message: "Daily mint status reset successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Error resetting daily mint status:", error);
    return Response.json(
      { success: false, error: "Failed to reset daily mint status" },
      { status: 500 }
    );
  }
}
