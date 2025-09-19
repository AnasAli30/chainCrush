import { NextRequest, NextResponse } from 'next/server';
import { hasUserFollowed, saveFollowAction } from '@/lib/database';
import { authenticatedFetch } from '@/lib/auth';
import { MongoClient } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');
    const platform = searchParams.get('platform') as 'x' | 'twitter' || 'x';

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing userAddress parameter' },
        { status: 400 }
      );
    }

    const hasFollowed = await hasUserFollowed(userAddress, platform);

    return NextResponse.json({
      success: true,
      hasFollowed
    });

  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userAddress, fid, platform = 'x' } = await request.json();

    if (!userAddress || !fid) {
      return NextResponse.json(
        { success: false, error: 'Missing userAddress or fid' },
        { status: 400 }
      );
    }

    // Check if user has already followed
    const alreadyFollowed = await hasUserFollowed(userAddress, platform);
    if (alreadyFollowed) {
      return NextResponse.json({
        success: true,
        message: 'Already followed',
        alreadyFollowed: true
      });
    }

    // Save follow action
    await saveFollowAction({
      userAddress,
      fid,
      platform,
      timestamp: Date.now(),
      rewardClaimed: true
    });

    // Grant follow reward (+1 gift box claims) - similar to share reward system
    const rewardResult = await grantFollowReward(userAddress, fid);
    
    if (!rewardResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to grant follow reward'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Follow action recorded successfully',
      newClaimsInPeriod: rewardResult.newClaimsInPeriod,
      remainingClaims: rewardResult.remainingClaims
    });

  } catch (error) {
    console.error('Error recording follow action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record follow action' },
      { status: 500 }
    );
  }
}

// Grant follow reward (+1 additional gift box claims) - similar to share reward system
async function grantFollowReward(userAddress: string, fid: number): Promise<{
  success: boolean;
  newClaimsInPeriod: number;
  remainingClaims: number;
}> {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/chaincrush');
  
  try {
    await client.connect();
    const db = client.db('chaincrush');
    const collection = db.collection('gameScores');
    
    const currentTime = Date.now();
    const FOLLOW_REWARD_CLAIMS = 1; // +1 gift box claim for following
    
    // Find user's current gift box data
    const userData = await collection.findOne({ fid });
    
    let newClaimsInPeriod = FOLLOW_REWARD_CLAIMS;
    let remainingClaims = 5 - FOLLOW_REWARD_CLAIMS; // Assuming 5 claims per period
    
    if (userData) {
      const lastGiftBoxUpdate = userData.lastGiftBoxUpdate || 0;
      const claimsInPeriod = userData.giftBoxClaimsInPeriod || 0;
      
      // Check if we're in a new 12-hour period
      const twelveHoursMs = 12 * 60 * 60 * 1000;
      if (currentTime >= lastGiftBoxUpdate + twelveHoursMs) {
        // New period, start fresh
        newClaimsInPeriod = FOLLOW_REWARD_CLAIMS;
        remainingClaims = 5 - FOLLOW_REWARD_CLAIMS;
      } else {
        // Same period, add to existing claims
        newClaimsInPeriod = claimsInPeriod + FOLLOW_REWARD_CLAIMS;
        remainingClaims = Math.max(0, 5 - newClaimsInPeriod);
      }
    }
    
    // Update user's record with follow reward
    await collection.updateOne(
      { fid },
      {
        $set: {
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
      remainingClaims
    };
    
  } catch (error) {
    console.error('Error granting follow reward:', error);
    return {
      success: false,
      newClaimsInPeriod: 0,
      remainingClaims: 0
    };
  } finally {
    await client.close();
  }
}
