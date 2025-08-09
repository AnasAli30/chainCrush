import { NextRequest } from "next/server";
import { saveGameScore } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const { fid, pfpUrl, username, score, level, userAddress } = await request.json();

    console.log(username)
    if (!fid || !pfpUrl || score === undefined || level === undefined) {
      return Response.json(
        { success: false, error: "Missing required fields: fid, pfpUrl, score, level" },
        { status: 400 }
      );
    }

    // Validate score and level
    if (score < 0 || score > 1000000) {
      return Response.json(
        { success: false, error: "Invalid score value" },
        { status: 400 }
      );
    }

    if (level < 1 || level > 100) {
      return Response.json(
        { success: false, error: "Invalid level value" },
        { status: 400 }
      );
    }

    // Save the game score
    await saveGameScore({
      fid,
      pfpUrl,
      username,
      score,
      level,
      userAddress,
      timestamp: Date.now()
    });

    return Response.json({
      success: true,
      data: { score, level, timestamp: Date.now() }
    });
  } catch (error) {
    console.error("Error submitting score:", error);
    return Response.json(
      { success: false, error: "Failed to submit score" },
      { status: 500 }
    );
  }
}

