import { NextRequest } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(_req: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('chaincrush')

    const doc = await db.collection('data').findOne<{ name: string; time?: number | Date }>(
      { name: 'chaincrush' },
      { projection: { _id: 0, name: 1, time: 1 } }
    )

    if (!doc) {
      return Response.json({ success: false, error: 'Document not found' }, { status: 404 })
    }


    return Response.json({ success: true, data: { name: doc.name, time: "1755679024" } })
  } catch (err) {
    console.error('GET /api/time error:', err)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

