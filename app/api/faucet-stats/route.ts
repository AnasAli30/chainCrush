import { NextRequest } from "next/server";
import { getWalletUsageStats } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const stats = await getWalletUsageStats();
    
    return Response.json({
      success: true,
      data: {
        walletStats: stats,
        totalWallets: stats.length,
        totalClaims: stats.reduce((sum, stat) => sum + stat.usageCount, 0),
        totalAmountDistributed: stats.reduce((sum, stat) => sum + parseFloat(stat.totalAmount), 0).toFixed(9)
      }
    });
  } catch (error) {
    console.error("Error getting faucet stats:", error);
    return Response.json(
      { success: false, error: "Failed to get faucet statistics" },
      { status: 500 }
    );
  }
}
