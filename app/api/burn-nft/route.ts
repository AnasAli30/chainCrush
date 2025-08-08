import { NextRequest } from "next/server";
import { ethers } from "ethers";

const PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY;
const TOKEN_REWARD_ADDRESS = process.env.TOKEN_REWARD_ADDRESS || "0x0000000000000000000000000000000000000000";

if (!PRIVATE_KEY) {
  throw new Error("SERVER_PRIVATE_KEY is not set");
}

export async function POST(request: NextRequest) {
  try {
    const { userAddress, tokenId, rewardToken, rewardAmount } = await request.json();

    if (!userAddress || tokenId === undefined || !rewardToken || rewardAmount === undefined) {
      return Response.json(
        { success: false, error: "Missing userAddress, tokenId, rewardToken, or rewardAmount" },
        { status: 400 }
      );
    }

    // Parse rewardAmount string to BigInt (assuming 18 decimals)
    const parsedRewardAmount = ethers.parseEther(rewardAmount.toString());

    // Create signature for NFT burning
    const messageHash = ethers.keccak256(
      ethers.solidityPacked(
        ["address", "uint256", "address", "uint256"],
        [userAddress, tokenId, rewardToken, parsedRewardAmount]
      )
    );

    
    // Sign the message
    const wallet = new ethers.Wallet(PRIVATE_KEY || "");
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));


    return Response.json({
      success: true,
      data: {
        signature,
        tokenId,
        rewardToken,
        rewardAmount: parsedRewardAmount.toString()
      }
    });
  } catch (error) {
    console.error("Error generating NFT burn signature:", error);
    return Response.json(
      { success: false, error: "Failed to generate signature" },
      { status: 500 }
    );
  }
} 