import { NextRequest } from 'next/server'
import { getTotalPlayersCount } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const totalPlayers = await getTotalPlayersCount()
    return Response.json({ success: true, data: { totalPlayers } })
  } catch (error) {
    console.error('Error getting active players:', error)
    return Response.json({ success: false, error: 'Failed to get active players' }, { status: 500 })
  }
}


