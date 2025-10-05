import { NextRequest, NextResponse } from 'next/server';
import { validateAuthKeyInDatabase } from '@/lib/database';

// Mini app reward configuration
const MINI_APP_COOLDOWN_HOURS = 3;
const MINI_APP_REWARD_CLAIMS = 3; // 3x daily reward

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

    // Check if user can claim mini app reward (3-hour cooldown)
    const canClaimResult = await checkMiniAppRewardEligibility(userAddress, fid);
    
    if (!canClaimResult.canClaim) {
      return NextResponse.json({
        success: false,
        error: 'Mini app reward cooldown active',
        timeUntilNextMiniApp: canClaimResult.timeUntilNextMiniApp,
        lastMiniAppTime: canClaimResult.lastMiniAppTime
      }, { status: 429 });
    }

    // Grant mini app reward (3 additional gift box claims)
    const rewardResult = await grantMiniAppReward(userAddress, fid);
    
    if (!rewardResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to grant mini app reward'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Mini app reward granted!',
      additionalClaims: MINI_APP_REWARD_CLAIMS,
      newClaimsInPeriod: rewardResult.newClaimsInPeriod,
      remainingClaims: rewardResult.remainingClaims,
      nextMiniAppTime: rewardResult.nextMiniAppTime
    });

  } catch (error) {
    console.error('Error processing mini app reward:', error);
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

    // Check mini app reward eligibility
    const canClaimResult = await checkMiniAppRewardEligibility(userAddress, fid);

    return NextResponse.json({
      success: true,
      canClaim: canClaimResult.canClaim,
      timeUntilNextMiniApp: canClaimResult.timeUntilNextMiniApp,
      lastMiniAppTime: canClaimResult.lastMiniAppTime,
      nextMiniAppTime: canClaimResult.nextMiniAppTime
    });

  } catch (error) {
    console.error('Error checking mini app reward eligibility:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Check if user can claim mini app reward (3-hour cooldown)
async function checkMiniAppRewardEligibility(userAddress: string, fid: number): Promise<{
  canClaim: boolean;
  timeUntilNextMiniApp: number;
  lastMiniAppTime?: number;
  nextMiniAppTime?: number;
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
        timeUntilNextMiniApp: 0
      };
    }
    
    const lastMiniAppTime = userData.lastMiniAppTime || 0;
    const currentTime = Date.now();
    const cooldownMs = MINI_APP_COOLDOWN_HOURS * 60 * 60 * 1000;
    const timeSinceLastMiniApp = currentTime - lastMiniAppTime;
    
    if (timeSinceLastMiniApp >= cooldownMs) {
      // Cooldown expired, can claim
      return {
        canClaim: true,
        timeUntilNextMiniApp: 0,
        lastMiniAppTime,
        nextMiniAppTime: currentTime + cooldownMs
      };
    } else {
      // Still in cooldown
      const timeUntilNextMiniApp = cooldownMs - timeSinceLastMiniApp;
      return {
        canClaim: false,
        timeUntilNextMiniApp,
        lastMiniAppTime,
        nextMiniAppTime: lastMiniAppTime + cooldownMs
      };
    }
    
  } finally {
    await client.close();
  }
}

// Grant mini app reward (3 additional gift box claims)
async function grantMiniAppReward(userAddress: string, fid: number): Promise<{
  success: boolean;
  newClaimsInPeriod: number;
  remainingClaims: number;
  nextMiniAppTime: number;
}> {
  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/bounce');
  
  try {
    await client.connect();
    const db = client.db('chaincrush');
    const collection = db.collection('gameScores');
    
    const currentTime = Date.now();
    const cooldownMs = MINI_APP_COOLDOWN_HOURS * 60 * 60 * 1000;
    const nextMiniAppTime = currentTime + cooldownMs;
    
    // Find user's current gift box data
    const userData = await collection.findOne({ fid });
    
    let newClaimsInPeriod = MINI_APP_REWARD_CLAIMS;
    let remainingClaims = 5 - MINI_APP_REWARD_CLAIMS; // Assuming 5 claims per period
    
    if (userData) {
      const lastGiftBoxUpdate = userData.lastGiftBoxUpdate || 0;
      const claimsInPeriod = userData.giftBoxClaimsInPeriod || 0;
      
      // Check if we're in a new 12-hour period
      const twelveHoursMs = 12 * 60 * 60 * 1000;
      if (currentTime >= lastGiftBoxUpdate + twelveHoursMs) {
        // New period, start fresh
        newClaimsInPeriod = MINI_APP_REWARD_CLAIMS;
        remainingClaims = 5 - MINI_APP_REWARD_CLAIMS;
      } else {
        // Same period, add to existing claims
        newClaimsInPeriod = claimsInPeriod + MINI_APP_REWARD_CLAIMS;
        remainingClaims = Math.max(0, 5 - newClaimsInPeriod);
      }
    }
    
    // Update user's record with mini app reward and cooldown
    await collection.updateOne(
      { fid },
      {
        $set: {
          lastMiniAppTime: currentTime,
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
      nextMiniAppTime
    };
    
  } finally {
    await client.close();
  }
}
