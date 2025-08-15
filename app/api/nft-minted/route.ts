import { NextRequest, NextResponse } from 'next/server';
import { incrementUserNftCount, updateUserNftInfo, updateUserDailyMintStatus } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { fid, nftName, userAddress } = await request.json();

    if (!fid || !nftName || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Increment NFT count
    await incrementUserNftCount(fid);
    
    // Update NFT info
    await updateUserNftInfo(fid, nftName);

    // Update user's daily mint status for leaderboard (only when NFT is successfully minted)
    await updateUserDailyMintStatus(userAddress, true);

    return NextResponse.json({
      success: true,
      message: 'NFT minting recorded successfully'
    });

  } catch (error) {
    console.error('Error recording NFT mint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record NFT minting' },
      { status: 500 }
    );
  }
}
