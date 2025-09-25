import { NextRequest } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('chaincrush')
    const totalMints = await db.collection('userMints').countDocuments()
    return Response.json({ success: true, data: { totalMints } })
  } catch (error) {
    console.error('Error getting total NFTs minted:', error)
    return Response.json({ success: false, error: 'Failed to get NFT total' }, { status: 500 })
  }
}


