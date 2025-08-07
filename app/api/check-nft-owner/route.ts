import { NextRequest } from "next/server";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, CHAINCRUSH_NFT_ABI } from "@/lib/contracts";

export async function POST(request: NextRequest) {
  try {
    const { tokenId, userAddress } = await request.json();

    if (tokenId === undefined || !userAddress) {
      return Response.json(
        { success: false, error: "Missing tokenId or userAddress" },
        { status: 400 }
      );
    }

    // Create provider
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://localhost:8545");
    
    // Create contract instance
    const contract = new ethers.Contract(
      CONTRACT_ADDRESSES.CHAINCRUSH_NFT,
      CHAINCRUSH_NFT_ABI,
      provider
    );

    try {
      // Get the owner of the token
      const owner = await contract.ownerOf(tokenId);
      const isOwner = owner.toLowerCase() === userAddress.toLowerCase();

      return Response.json({
        success: true,
        isOwner,
        owner: owner
      });
    } catch (error) {
      // Token doesn't exist or other error
      return Response.json({
        success: true,
        isOwner: false,
        error: "Token does not exist"
      });
    }
  } catch (error) {
    console.error("Error checking NFT ownership:", error);
    return Response.json(
      { success: false, error: "Failed to check ownership" },
      { status: 500 }
    );
  }
} 