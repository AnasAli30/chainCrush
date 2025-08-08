import { NextRequest } from "next/server";
import { ethers } from "ethers";
import { canUserMint, incrementDailyMintCount, saveUserMint, getUserDailyMintCount } from "@/lib/database";

const PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY;
const CHAINCRUSH_NFT_ADDRESS = process.env.CHAINCRUSH_NFT_ADDRESS || "0x0000000000000000000000000000000000000000";
const DAILY_MINT_LIMIT = parseInt(process.env.DAILY_MINT_LIMIT || "6");

if (!PRIVATE_KEY) {
  throw new Error("SERVER_PRIVATE_KEY is not set");
}

export async function POST(request: NextRequest) {
  try {
    const { userAddress, score } = await request.json();

    if (!userAddress || !score) {
      return Response.json(
        { success: false, error: "Missing userAddress or score" },
        { status: 400 }
      );
    }

    // Check daily mint limit
    const canMint = await canUserMint(userAddress, DAILY_MINT_LIMIT);
    if (!canMint) {
      return Response.json(
        { 
          success: false, 
          error: `Daily mint limit reached. You can mint ${DAILY_MINT_LIMIT} NFTs per day.` 
        },
        { status: 429 }
      );
    }

    // Validate score (optional - you can add more validation)
    if (score < 0 || score > 1000000) {
      return Response.json(
        { success: false, error: "Invalid score value" },
        { status: 400 }
      );
    }

    // Create signature for NFT minting
    const timestamp = Math.floor(Date.now() / 1000);
    const packedData = 
      ethers.solidityPacked(
        ["address", "uint256", "uint256"],
        [userAddress, score, timestamp]
      );

    const messageHash = ethers.keccak256(packedData);

    // Sign the message
    const wallet = new ethers.Wallet(PRIVATE_KEY || "");
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));


    // Increment daily mint count
    await incrementDailyMintCount(userAddress);

    // Save mint record to database
    await saveUserMint({
      userAddress,
      score,
      timestamp,
      signature
    });

    return Response.json({
      success: true,
      data: {
        signature,
        timestamp,
        score,
        dailyMintsRemaining: DAILY_MINT_LIMIT - (await getUserDailyMintCount(userAddress)) - 1
      }
    });
  } catch (error) {
    console.error("Error generating NFT mint signature:", error);
    return Response.json(
      { success: false, error: "Failed to generate signature" },
      { status: 500 }
    );
  }
} 