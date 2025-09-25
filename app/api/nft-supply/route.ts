import { NextRequest } from 'next/server'
import { ARBITRUM_RPC_URL } from '@/lib/constants'
import { CHAINCRUSH_NFT_ABI, CONTRACT_ADDRESSES } from '@/lib/contracts'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    // Lazy import ethers to avoid bundling issues
    const { ethers } = await import('ethers')
    const provider = new ethers.JsonRpcProvider(ARBITRUM_RPC_URL)
    const contract = new ethers.Contract(
      CONTRACT_ADDRESSES.CHAINCRUSH_NFT,
      CHAINCRUSH_NFT_ABI,
      provider
    )

    const [currentTokenId, maxSupply, remaining] = await Promise.all([
      contract.getCurrentTokenId(),
      contract.MAX_SUPPLY(),
      contract.getRemainingSupply(),
    ])

    return Response.json({
      success: true,
      data: {
        totalMints: Number(currentTokenId),
        maxSupply: Number(maxSupply),
        remaining: Number(remaining),
      },
    })
  } catch (error) {
    console.error('Error reading NFT supply:', error)
    return Response.json({ success: false, error: 'Failed to read NFT supply' }, { status: 500 })
  }
}


