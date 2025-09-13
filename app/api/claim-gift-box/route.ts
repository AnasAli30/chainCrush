import { NextRequest, NextResponse } from 'next/server';
import { claimGiftBox } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Authentication is handled by middleware, so we can proceed directly
    const body = await request.json();
    const { userAddress, fid } = body;

    if (!userAddress) {
      return NextResponse.json({ error: 'Missing userAddress' }, { status: 400 });
    }

    // Claim the gift box
    const result = await claimGiftBox(userAddress, fid);

    if (!result.success) {
      return NextResponse.json({
        error: 'Daily gift box limit reached',
        claimsToday: result.claimsToday,
        remainingClaims: result.remainingClaims
      }, { status: 429 });
    }

    return NextResponse.json({
      success: true,
      tokenType: result.tokenType,
      amount: result.amount,
      amountInWei: result.amountInWei,
      signature: result.signature,
      claimsToday: result.claimsToday,
      remainingClaims: result.remainingClaims
    });

  } catch (error) {
    console.error('Error claiming gift box:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');
    const fidParam = searchParams.get('fid');
    const fid = fidParam ? parseInt(fidParam) : undefined;
    const statsParam = searchParams.get('stats');

    if (!userAddress) {
      return NextResponse.json({ error: 'Missing userAddress' }, { status: 400 });
    }

    if (statsParam === 'true') {
      // Get full gift box stats including token totals
      const { getUserGiftBoxStats } = await import('@/lib/database');
      const stats = await getUserGiftBoxStats(userAddress, fid);

      return NextResponse.json({
        success: true,
        stats
      });
    } else {
      // Check if user can see gift box (without incrementing count)
      const { canUserSeeGiftBox } = await import('@/lib/database');
      const result = await canUserSeeGiftBox(userAddress, fid);

      return NextResponse.json({
        success: true,
        canSee: result.canSee,
        claimsToday: result.claimsToday,
        remainingClaims: result.remainingClaims,
        lastClaimTime: result.lastClaimTime
      });
    }

  } catch (error) {
    console.error('Error checking gift box visibility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

