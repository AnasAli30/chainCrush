import { NextRequest, NextResponse } from 'next/server';
import { incrementUserNftCount, updateUserNftInfo } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { fid, nftName } = await request.json();

    if (!fid || !nftName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Increment NFT count
    await incrementUserNftCount(fid);
    
    // Update NFT info
    await updateUserNftInfo(fid, nftName);

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
