import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { email, walletAddress } = await request.json()

    // Validate required fields
    if (!email || !walletAddress) {
      return NextResponse.json(
        { error: 'Email and wallet address are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate wallet address format (basic Ethereum address check)
    const walletRegex = /^0x[a-fA-F0-9]{40}$/
    if (!walletRegex.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('chaincrush')

    // Check if email or wallet already exists
    const existingEntry = await db.collection('waitlist').findOne({
      $or: [
        { email: email.toLowerCase() },
        { walletAddress: walletAddress.toLowerCase() }
      ]
    })

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Email or wallet address already registered' },
        { status: 409 }
      )
    }

    // Add to waitlist
    const waitlistEntry = {
      email: email.toLowerCase(),
      walletAddress: walletAddress.toLowerCase(),
      timestamp: new Date(),
      status: 'pending',
      source: 'web'
    }

    await db.collection('waitlist').insertOne(waitlistEntry)

    return NextResponse.json(
      { 
        message: 'Successfully added to waitlist',
        email: email.toLowerCase(),
        walletAddress: walletAddress.toLowerCase()
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Waitlist submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('chaincrush')
    
    const count = await db.collection('waitlist').countDocuments()
    
    return NextResponse.json({ count })
  } catch (error) {
    console.error('Waitlist count error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}