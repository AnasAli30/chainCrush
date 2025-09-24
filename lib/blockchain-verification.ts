import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { arbitrum } from 'viem/chains';
import { ARBITRUM_RPC_URL, BOOSTER_SHOP_ADDRESS, ARB_TOKEN_ADDRESS } from './constants';

// Create public client for reading blockchain data
const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http(ARBITRUM_RPC_URL)
});

// BoosterShop contract ABI (simplified for verification)
const BOOSTER_SHOP_ABI = [
  {
    "inputs": [
      { "name": "fid", "type": "uint256" },
      { "name": "boosterType", "type": "uint8" },
      { "name": "quantity", "type": "uint256" }
    ],
    "name": "buyBoosters",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "boosterType", "type": "uint8" }
    ],
    "name": "boosterPrices",
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// ERC20 ABI for ARB token
const ERC20_ABI = [
  {
    "inputs": [
      { "name": "from", "type": "address" },
      { "name": "to", "type": "address" },
      { "name": "value", "type": "uint256" }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" },
      { "name": "value", "type": "uint256" }
    ],
    "name": "Approval",
    "type": "event"
  }
] as const;

export interface TransactionVerificationResult {
  isValid: boolean;
  error?: string;
  transactionDetails?: {
    hash: string;
    blockNumber: bigint;
    from: string;
    to: string;
    value: bigint;
    gasUsed: bigint;
    status: 'success' | 'reverted';
  };
  boosterPurchase?: {
    fid: bigint;
    boosterType: number;
    quantity: bigint;
    pricePerUnit: bigint;
    totalCost: bigint;
  };
  arbTransfer?: {
    from: string;
    to: string;
    amount: bigint;
  };
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  previousUsage?: {
    fid: number;
    boosterType: string;
    quantity: number;
    timestamp: Date;
  };
}

/**
 * Verify if a transaction hash is valid and represents a successful booster purchase
 */
export async function verifyTransaction(
  transactionHash: string,
  expectedFid: number,
  expectedBoosterType: number,
  expectedQuantity: number
): Promise<TransactionVerificationResult> {
  try {
    // 1. Get transaction details
    const tx = await publicClient.getTransaction({ hash: transactionHash as `0x${string}` });
    
    if (!tx) {
      return {
        isValid: false,
        error: 'Transaction not found'
      };
    }

    // 2. Get transaction receipt to check if it was successful
    const receipt = await publicClient.getTransactionReceipt({ hash: transactionHash as `0x${string}` });
    
    if (!receipt) {
      return {
        isValid: false,
        error: 'Transaction receipt not found'
      };
    }

    if (receipt.status !== 'success') {
      return {
        isValid: false,
        error: 'Transaction failed or was reverted'
      };
    }

    // 3. Verify transaction is to our contract
    if (receipt.to?.toLowerCase() !== BOOSTER_SHOP_ADDRESS.toLowerCase()) {
      return {
        isValid: false,
        error: 'Transaction is not to the correct contract address'
      };
    }

    // 4. Parse transaction data to extract buyBoosters call
    const buyBoostersCall = await parseBuyBoostersCall(tx.input);

    
    if (!buyBoostersCall) {
      return {
        isValid: false,
        error: `Transaction does not contain a valid buyBoosters call ${buyBoostersCall}`
      };
    }

    // 5. Verify the buyBoosters parameters match expected values
    if (buyBoostersCall.fid !== BigInt(expectedFid)) {
      return {
        isValid: false,
        error: `FID mismatch: expected ${expectedFid}, got ${buyBoostersCall.fid}`
      };
    }

    if (buyBoostersCall.boosterType !== expectedBoosterType) {
      return {
        isValid: false,
        error: `Booster type mismatch: expected ${expectedBoosterType}, got ${buyBoostersCall.boosterType}`
      };
    }

    if (buyBoostersCall.quantity !== BigInt(expectedQuantity)) {
      return {
        isValid: false,
        error: `Quantity mismatch: expected ${expectedQuantity}, got ${buyBoostersCall.quantity}`
      };
    }

    // 6. Verify ARB transfer to contract
    console.log("receipt",receipt)
    const arbTransfer = await findARBTransfer(receipt.logs, tx.from);
    
    if (!arbTransfer) {
      return {
        isValid: false,
        error: 'No ARB transfer found to contract'
      };
    }

    // 7. Verify ARB transfer amount matches expected cost
    const expectedCost = await getExpectedCost(expectedBoosterType, expectedQuantity);
    
    if (arbTransfer.amount !== expectedCost) {
      return {
        isValid: false,
        error: `ARB transfer amount mismatch: expected ${formatEther(expectedCost)} ARB, got ${formatEther(arbTransfer.amount)} ARB`
      };
    }

    return {
      isValid: true,
      transactionDetails: {
        hash: transactionHash,
        blockNumber: receipt.blockNumber,
        from: tx.from,
        to: receipt.to,
        value: tx.value,
        gasUsed: receipt.gasUsed,
        status: receipt.status
      },
      boosterPurchase: {
        fid: buyBoostersCall.fid,
        boosterType: buyBoostersCall.boosterType,
        quantity: buyBoostersCall.quantity,
        pricePerUnit: buyBoostersCall.pricePerUnit,
        totalCost: buyBoostersCall.totalCost
      },
      arbTransfer: arbTransfer
    };

  } catch (error) {
    console.error('Transaction verification error:', error);
    return {
      isValid: false,
      error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Parse the buyBoosters function call from transaction input data
 */
async function parseBuyBoostersCall(input: `0x${string}`) {
  try {
    // The buyBoosters function signature hash
    console.log(input)
    const buyBoostersSelector = `0x6b7bbf67`
    
    // Check if the input starts with the buyBoosters selector
    if (!input.startsWith(buyBoostersSelector)) {
      console.log(buyBoostersSelector);
      return null;
    }

    // Decode the parameters (skip the 4-byte selector)
    const paramData = input.slice(10); // Remove '0x' and 4-byte selector
    
    // Parse fid (uint256, 32 bytes)
    const fidHex = paramData.slice(0, 64);
    const fid = BigInt('0x' + fidHex);
    
    // Parse boosterType (uint8, 32 bytes padded)
    const boosterTypeHex = paramData.slice(64, 128);
    const boosterType = parseInt(boosterTypeHex, 16);
    
    // Parse quantity (uint256, 32 bytes)
    const quantityHex = paramData.slice(128, 192);
    const quantity = BigInt('0x' + quantityHex);

    // Get the expected price from contract
    const pricePerUnit = await publicClient.readContract({
      address: BOOSTER_SHOP_ADDRESS,
      abi: BOOSTER_SHOP_ABI,
      functionName: 'boosterPrices',
      args: [boosterType]
    });

    return {
      fid,
      boosterType,
      quantity,
      pricePerUnit,
      totalCost: pricePerUnit * quantity
    };
  } catch (error) {
    console.error('Error parsing buyBoosters call:', error);
    return null;
  }
}

/**
 * Find ARB transfer event in transaction logs
 */
function findARBTransfer(logs: any[], fromAddress: string) {
  console.log('Searching for ARB transfer in logs:', logs.length);
  
  for (const log of logs) {
    // Check if this is a Transfer event from ARB token contract
    if (log.address.toLowerCase() === ARB_TOKEN_ADDRESS.toLowerCase()) {
      try {
        console.log('Found ARB token log:', {
          address: log.address,
          topics: log.topics,
          data: log.data
        });

        // Check if this is a Transfer event (topics[0] should be Transfer event signature)
        // Transfer event signature: keccak256("Transfer(address,address,uint256)")
        const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        
        if (log.topics[0] === transferEventSignature && log.topics.length >= 3) {
          // Parse Transfer event (from, to, value)
          const transferEvent = {
            from: '0x' + log.topics[1].slice(26),// Already includes 0x prefix
            to: '0x' + log.topics[2].slice(26), // Already includes 0x prefix
            amount: BigInt(log.data)
          };
          
          console.log('Parsed transfer event:', transferEvent);
          console.log('From address:', fromAddress.toLowerCase());
          console.log('Transfer from:', transferEvent.from.toLowerCase());
          console.log('Transfer to:', transferEvent.to.toLowerCase());
          console.log('Contract address:', BOOSTER_SHOP_ADDRESS.toLowerCase());

          // Check if transfer is from the transaction sender to our contract
          if (transferEvent.from.toLowerCase() === fromAddress.toLowerCase() &&
              transferEvent.to.toLowerCase() === BOOSTER_SHOP_ADDRESS.toLowerCase()) {
            console.log('✅ Found matching ARB transfer!');
            return transferEvent;
          }
        }
      } catch (error) {
        console.error('Error parsing transfer event:', error);
        continue;
      }
    }
  }
  
  console.log('❌ No matching ARB transfer found');
  return null;
}

/**
 * Get expected cost for a booster purchase
 */
async function getExpectedCost(boosterType: number, quantity: number): Promise<bigint> {
  try {
    const pricePerUnit = await publicClient.readContract({
      address: BOOSTER_SHOP_ADDRESS,
      abi: BOOSTER_SHOP_ABI,
      functionName: 'boosterPrices',
      args: [boosterType]
    });

    return pricePerUnit * BigInt(quantity);
  } catch (error) {
    console.error('Error getting expected cost:', error);
    // Fallback to hardcoded prices
    const prices = {
      0: parseEther('0.2'), // Shuffle
      1: parseEther('0.1')  // Party Popper
    };
    return prices[boosterType as keyof typeof prices] * BigInt(quantity);
  }
}

/**
 * Check if a transaction hash has been used before
 */
export async function checkDuplicateTransaction(
  transactionHash: string,
  db: any
): Promise<DuplicateCheckResult> {
  try {
    const gameScoreCollection = db.collection('gameScores');
    
    // Search for this transaction hash in any user's boosterTransactions array
    const existingTransaction = await gameScoreCollection.findOne({
      'boosterTransactions.transactionHash': transactionHash
    });

    if (existingTransaction) {
      // Find the specific transaction
      const transaction = existingTransaction.boosterTransactions.find(
        (tx: any) => tx.transactionHash === transactionHash
      );

      return {
        isDuplicate: true,
        previousUsage: {
          fid: existingTransaction.fid,
          boosterType: transaction.type,
          quantity: transaction.quantity,
          timestamp: transaction.timestamp
        }
      };
    }

    return {
      isDuplicate: false
    };
  } catch (error) {
    console.error('Error checking duplicate transaction:', error);
    return {
      isDuplicate: false
    };
  }
}
