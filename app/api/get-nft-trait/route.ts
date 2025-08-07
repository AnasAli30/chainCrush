import { NextRequest } from "next/server";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, CHAINCRUSH_NFT_ABI, NFTTrait } from "@/lib/contracts";

export async function POST(request: NextRequest) {
  try {
    const { tokenId } = await request.json();

    if (tokenId === undefined) {
      return Response.json(
        { success: false, error: "Missing tokenId" },
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
      // Get the trait of the token
      const trait = await contract.getTokenTrait(tokenId);
      const traitNumber = Number(trait);

      return Response.json({
        success: true,
        trait: traitNumber as NFTTrait
      });
    } catch (error) {
      // Token doesn't exist or other error
      return Response.json({
        success: true,
        trait: NFTTrait.Common, // Default fallback
        error: "Token does not exist"
      });
    }
  } catch (error) {
    console.error("Error getting NFT trait:", error);
    return Response.json(
      { success: false, error: "Failed to get trait" },
      { status: 500 }
    );
  }
} 