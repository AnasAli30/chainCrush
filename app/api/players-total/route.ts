import { NextRequest } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('chaincrush')
    const totalPlayers = await db.collection('gameScores').countDocuments()
    return Response.json({ success: true, data: { totalPlayers } })
  } catch (error) {
    console.error('Error getting total players (all docs):', error)
    return Response.json({ success: false, error: 'Failed to get total players' }, { status: 500 })
  }
}


