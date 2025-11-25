import { NextRequest, NextResponse } from 'next/server';
import { claimGiftBox } from '@/lib/database';
import Pusher from 'pusher';

// Initialize Pusher server instance (lazy initialization)
function getPusherInstance(): Pusher | null {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';

  // Validate all required credentials are present
  if (!appId || !key || !secret) {
    console.warn('⚠️ Pusher credentials missing. Notifications will not be sent.');
    return null;
  }

  try {
    return new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true
    });
  } catch (error) {
    console.error('❌ Failed to initialize Pusher:', error);
    return null;
  }
}

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

    // Trigger Pusher notification if user won a token (not "none")
    if (result.tokenType !== 'none' && result.amount > 0) {
      const pusher = getPusherInstance();
      if (pusher) {
        try {
          await pusher.trigger('Monad-spin', 'win', {
            username: result.username,
            address: userAddress,
            pfpUrl: result.pfpUrl,
            score: result.score || 0,
            amount: result.amount,
            token: result.tokenType
          });
          console.log('✅ Pusher notification sent for win:', {
            username: result.username,
            token: result.tokenType,
            amount: result.amount
          });
        } catch (pusherError: any) {
          console.error('❌ Error sending Pusher notification:', {
            message: pusherError?.message || 'Unknown error',
            status: pusherError?.status,
            body: pusherError?.body,
            url: pusherError?.url
          });
          // Don't fail the request if Pusher fails
        }
      } else {
        console.warn('⚠️ Pusher not initialized. Skipping notification.');
      }
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

