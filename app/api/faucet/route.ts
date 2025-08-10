import { NextRequest } from "next/server";
import { ethers } from "ethers";
import { saveFaucetClaim, hasUserClaimedFaucet } from "@/lib/database";

// Multiple private keys for load balancing and redundancy
const PRIVATE_KEYS = [
  process.env.SERVER_PRIVATE_KEY,
  process.env.SERVER_PRIVATE_KEY_2,
  process.env.SERVER_PRIVATE_KEY_3,
  process.env.SERVER_PRIVATE_KEY_4,
  process.env.SERVER_PRIVATE_KEY_5,
].filter(Boolean); // Remove any undefined keys

const FAUCET_AMOUNT = "0.000009"; // 0.000009 ETH
const RPC_URL = process.env.RPC_URL || "https://sepolia.infura.io/v3/your-project-id";

if (PRIVATE_KEYS.length === 0) {
  throw new Error("At least one SERVER_PRIVATE_KEY must be set");
}

if (!RPC_URL) {
  throw new Error("NEXT_PUBLIC_RPC_URL is not set");
}

export async function POST(request: NextRequest) {
  try {
    const { userAddress } = await request.json();

    if (!userAddress) {
      return Response.json(
        { success: false, error: "Missing userAddress" },
        { status: 400 }
      );
    }

    // Validate Ethereum address format
    if (!ethers.isAddress(userAddress)) {
      return Response.json(
        { success: false, error: "Invalid Ethereum address" },
        { status: 400 }
      );
    }

    // Check if user has already claimed faucet
    const hasClaimed = await hasUserClaimedFaucet(userAddress);
    if (hasClaimed) {
      return Response.json(
        { success: false, error: "Faucet already claimed by this address" },
        { status: 409 }
      );
    }

    // Check user's current balance
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const balance = await provider.getBalance(userAddress);
    
    // Only send if balance is 0
    // if (balance > BigInt(0)) {
    //   return Response.json(
    //     { success: false, error: "Wallet has sufficient balance" },
    //     { status: 400 }
    //   );
    // }

    // Function to randomly select a wallet key
    const selectRandomWallet = () => {
      const randomIndex = Math.floor(Math.random() * PRIVATE_KEYS.length);
      const wallet = new ethers.Wallet(PRIVATE_KEYS[randomIndex]!, provider);
      return { wallet, keyIndex: randomIndex + 1 };
    };

    const faucetAmount = ethers.parseEther(FAUCET_AMOUNT);
    
    // Randomly select a wallet
    const selectedWallet = selectRandomWallet();
    
    console.log(`Using wallet ${selectedWallet.keyIndex}`);

    // Send transaction using the selected wallet
    const tx = await selectedWallet.wallet.sendTransaction({
      to: userAddress,
      value: faucetAmount,
    });

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    // Save faucet claim to database
    await saveFaucetClaim({
      userAddress,
      amount: FAUCET_AMOUNT,
      transactionHash: tx.hash,
      timestamp: Date.now(),
      blockNumber: receipt?.blockNumber || 0,
      walletIndex: selectedWallet.keyIndex
    });

    return Response.json({
      success: true,
      data: {
        transactionHash: tx.hash,
        amount: FAUCET_AMOUNT,
        userAddress
      }
    });

  } catch (error: any) {
    console.error("Error in faucet API:", error);
    
    // Don't expose internal errors to client
    return Response.json(
      { success: false, error: "Failed to process faucet request" },
      { status: 500 }
    );
  }
}
