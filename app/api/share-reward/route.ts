import { NextRequest, NextResponse } from 'next/server';
import { validateAuthKeyInDatabase } from '@/lib/database';

// Share reward configuration
const SHARE_COOLDOWN_HOURS = 6;
const SHARE_REWARD_CLAIMS = 2;

export async function POST(request: NextRequest) {
  try {
    // Get authentication headers
    const fusedKey = request.headers.get('x-fused-key');
    const randomString = request.headers.get('x-random-string');
    
    if (!fusedKey || !randomString) {
      return NextResponse.json(
        { success: false, error: 'Missing authentication headers' },
        { status: 401 }
      );
    }

    // Validate authentication key in database for additional security
    const isValidAuth = await validateAuthKeyInDatabase(fusedKey, randomString);
    if (!isValidAuth) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userAddress, fid } = body;

    if (!userAddress || !fid) {
      return NextResponse.json(
        { success: false, error: 'Missing userAddress or fid' },
        { status: 400 }
      );
    }

    // Check if user can claim share reward (6-hour cooldown)
    const canClaimResult = await checkShareRewardEligibility(userAddress, fid);
    
    if (!canClaimResult.canClaim) {
      return NextResponse.json({
        success: false,
        error: 'Share reward cooldown active',
        timeUntilNextShare: canClaimResult.timeUntilNextShare,
        lastShareTime: canClaimResult.lastShareTime
      }, { status: 429 });
    }

    // Grant share reward (2 additional gift box claims)
    const rewardResult = await grantShareReward(userAddress, fid);
    
    if (!rewardResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to grant share reward'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Share reward granted!',
      additionalClaims: SHARE_REWARD_CLAIMS,
      newClaimsInPeriod: rewardResult.newClaimsInPeriod,
      remainingClaims: rewardResult.remainingClaims,
      nextShareTime: rewardResult.nextShareTime
    });

  } catch (error) {
    console.error('Error processing share reward:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authentication headers
    const fusedKey = request.headers.get('x-fused-key');
    const randomString = request.headers.get('x-random-string');
    
    if (!fusedKey || !randomString) {
      return NextResponse.json(
        { success: false, error: 'Missing authentication headers' },
        { status: 401 }
      );
    }

    // Validate authentication key in database for additional security
    const isValidAuth = await validateAuthKeyInDatabase(fusedKey, randomString);
    if (!isValidAuth) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');
    const fidParam = searchParams.get('fid');
    const fid = fidParam ? parseInt(fidParam) : undefined;

    if (!userAddress || !fid) {
      return NextResponse.json(
        { success: false, error: 'Missing userAddress or fid' },
        { status: 400 }
      );
    }

    // Check share reward eligibility
    const canClaimResult = await checkShareRewardEligibility(userAddress, fid);

    return NextResponse.json({
      success: true,
      canClaim: canClaimResult.canClaim,
      timeUntilNextShare: canClaimResult.timeUntilNextShare,
      lastShareTime: canClaimResult.lastShareTime,
      nextShareTime: canClaimResult.nextShareTime
    });

  } catch (error) {
    console.error('Error checking share reward eligibility:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Check if user can claim share reward (6-hour cooldown)
async function checkShareRewardEligibility(userAddress: string, fid: number): Promise<{
  canClaim: boolean;
  timeUntilNextShare: number;
  lastShareTime?: number;
  nextShareTime?: number;
}> {
  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/bounce');
  
  try {
    await client.connect();
    const db = client.db('chaincrush');
    const collection = db.collection('gameScores');
    
    // Find user's record
    const userData = await collection.findOne({ fid });
    
    if (!userData) {
      // New user can claim
      return {
        canClaim: true,
        timeUntilNextShare: 0
      };
    }
    
    const lastShareTime = userData.lastShareTime || 0;
    const currentTime = Date.now();
    const cooldownMs = SHARE_COOLDOWN_HOURS * 60 * 60 * 1000;
    const timeSinceLastShare = currentTime - lastShareTime;
    
    if (timeSinceLastShare >= cooldownMs) {
      // Cooldown expired, can claim
      return {
        canClaim: true,
        timeUntilNextShare: 0,
        lastShareTime,
        nextShareTime: currentTime + cooldownMs
      };
    } else {
      // Still in cooldown
      const timeUntilNextShare = cooldownMs - timeSinceLastShare;
      return {
        canClaim: false,
        timeUntilNextShare,
        lastShareTime,
        nextShareTime: lastShareTime + cooldownMs
      };
    }
    
  } finally {
    await client.close();
  }
}

// Grant share reward (2 additional gift box claims)
async function grantShareReward(userAddress: string, fid: number): Promise<{
  success: boolean;
  newClaimsInPeriod: number;
  remainingClaims: number;
  nextShareTime: number;
}> {
  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/bounce');
  
  try {
    await client.connect();
    const db = client.db('chaincrush');
    const collection = db.collection('gameScores');
    
    const currentTime = Date.now();
    const cooldownMs = SHARE_COOLDOWN_HOURS * 60 * 60 * 1000;
    const nextShareTime = currentTime + cooldownMs;
    
    // Find user's current gift box data
    const userData = await collection.findOne({ fid });
    
    let newClaimsInPeriod = SHARE_REWARD_CLAIMS;
    let remainingClaims = 5 - SHARE_REWARD_CLAIMS; // Assuming 5 claims per period
    
    if (userData) {
      const lastGiftBoxUpdate = userData.lastGiftBoxUpdate || 0;
      const claimsInPeriod = userData.giftBoxClaimsInPeriod || 0;
      
      // Check if we're in a new 12-hour period
      const twelveHoursMs = 12 * 60 * 60 * 1000;
      if (currentTime >= lastGiftBoxUpdate + twelveHoursMs) {
        // New period, start fresh
        newClaimsInPeriod = SHARE_REWARD_CLAIMS;
        remainingClaims = 5 - SHARE_REWARD_CLAIMS;
      } else {
        // Same period, add to existing claims
        newClaimsInPeriod = claimsInPeriod - SHARE_REWARD_CLAIMS;
        remainingClaims = Math.max(0, 5 - newClaimsInPeriod);
      }
    }
    
    // Update user's record with share reward and cooldown
    await collection.updateOne(
      { fid },
      {
        $set: {
          lastShareTime: currentTime,
          giftBoxClaimsInPeriod: newClaimsInPeriod,
          lastGiftBoxUpdate: currentTime,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    return {
      success: true,
      newClaimsInPeriod,
      remainingClaims,
      nextShareTime
    };
    
  } finally {
    await client.close();
  }
}
