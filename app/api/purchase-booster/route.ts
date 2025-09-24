import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyTransaction, checkDuplicateTransaction } from '@/lib/blockchain-verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, boosterType, quantity, transactionHash } = body;

    // Validate required fields
    if (!fid || boosterType === undefined || !quantity || !transactionHash) {
      return NextResponse.json(
        { error: 'Missing required fields: fid, boosterType, quantity, transactionHash' },
        { status: 400 }
      );
    }

    // Validate booster type (0 = SHUFFLE, 1 = PARTY_POPPER)
    if (boosterType !== 0 && boosterType !== 1) {
      return NextResponse.json(
        { error: 'Invalid booster type. Must be 0 (SHUFFLE) or 1 (PARTY_POPPER)' },
        { status: 400 }
      );
    }

    // Validate quantity
    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('chaincrush');
    const gameScoreCollection = db.collection('gameScores');

    console.log('Processing purchase:', { fid, boosterType, quantity, transactionHash });

    // 1. Check for duplicate transaction
    console.log('Checking for duplicate transaction...');
    const duplicateCheck = await checkDuplicateTransaction(transactionHash, db);
    
    if (duplicateCheck.isDuplicate) {
      console.log('Duplicate transaction detected:', duplicateCheck.previousUsage);
      return NextResponse.json(
        { 
          error: 'Transaction hash already used',
          details: `This transaction was already used by FID ${duplicateCheck.previousUsage?.fid} on ${duplicateCheck.previousUsage?.timestamp}`
        },
        { status: 400 }
      );
    }

    // 2. Verify transaction on blockchain
    console.log('Verifying transaction on blockchain...');
    const verificationResult = await verifyTransaction(
      transactionHash,
      fid,
      boosterType,
      quantity
    );

    if (!verificationResult.isValid) {
      console.log('Transaction verification failed:', verificationResult.error);
      return NextResponse.json(
        { 
          error: 'Transaction verification failed',
          details: verificationResult.error
        },
        { status: 400 }
      );
    }

    console.log('Transaction verified successfully:', {
      blockNumber: verificationResult.transactionDetails?.blockNumber,
      from: verificationResult.transactionDetails?.from,
      totalCost: verificationResult.boosterPurchase?.totalCost,
      arbTransferred: verificationResult.arbTransfer?.amount
    });

    // 3. Find the user's game score document
    const existingUser = await gameScoreCollection.findOne({ fid: fid });
console.log(existingUser)
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found. Please play the game first.' },
        { status: 404 }
      );
    }

    // Define booster names for database
    const boosterNames = {
      0: 'shuffle',
      1: 'partyPopper'
    };

    const boosterName = boosterNames[boosterType as keyof typeof boosterNames];

    // Update the user's booster inventory
    const updateResult = await gameScoreCollection.updateOne(
      { fid: fid },
      {
        $inc: {
          [`boosters.${boosterName}`]: quantity
        },
        $set: {
          lastUpdated: new Date()
        },
        $push: {
          boosterTransactions: {
            type: boosterName,
            quantity: quantity,
            transactionHash: transactionHash,
            timestamp: new Date()
          }
        } as any
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update user boosters' },
        { status: 500 }
      );
    }

    // Get updated user data
    const updatedUser = await gameScoreCollection.findOne({ fid: fid });

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${quantity} ${boosterName} booster(s)`,
      data: {
        fid: fid,
        boosterType: boosterName,
        quantity: quantity,
        newTotal: updatedUser?.boosters?.[boosterName] || 0,
        transactionHash: transactionHash,
        verification: {
          blockNumber: verificationResult.transactionDetails?.blockNumber?.toString(),
          from: verificationResult.transactionDetails?.from,
          totalCost: verificationResult.boosterPurchase?.totalCost?.toString(),
          arbTransferred: verificationResult.arbTransfer?.amount?.toString()
        }
      }
    });

  } catch (error) {
    console.error('Error purchasing booster:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user's booster inventory
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json(
        { error: 'FID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('chaincrush');
    const gameScoreCollection = db.collection('gameScores');

    const user = await gameScoreCollection.findOne({ fid: parseInt(fid) });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fid: user.fid,
        boosters: user.boosters || {
          shuffle: 0,
          partyPopper: 0
        },
        boosterTransactions: user.boosterTransactions || []
      }
    });

  } catch (error) {
    console.error('Error fetching booster inventory:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, boosterType, used } = body;

    // Validate required fields
    if (!fid || boosterType === undefined || !used) {
      return NextResponse.json(
        { error: 'Missing required fields: fid, boosterType, used' },
        { status: 400 }
      );
    }

    // Validate booster type (0 = SHUFFLE, 1 = PARTY_POPPER)
    if (boosterType !== 0 && boosterType !== 1) {
      return NextResponse.json(
        { error: 'Invalid booster type. Must be 0 (SHUFFLE) or 1 (PARTY_POPPER)' },
        { status: 400 }
      );
    }

    // Validate used quantity
    if (used <= 0) {
      return NextResponse.json(
        { error: 'Used quantity must be greater than 0' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('chaincrush');
    const gameScoreCollection = db.collection('gameScores');

    // Define booster names for database (same as POST)
    const boosterNames = {
      0: 'shuffle',
      1: 'partyPopper'
    };

    const boosterName = boosterNames[boosterType as keyof typeof boosterNames];

    // Find the user's game score document
    const existingUser = await gameScoreCollection.findOne({ fid: fid });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found. Please play the game first.' },
        { status: 404 }
      );
    }

    // Check if user has enough boosters
    const currentCount = existingUser.boosters?.[boosterName] || 0;
    if (currentCount < used) {
      return NextResponse.json(
        { error: `Insufficient ${boosterName} boosters. Available: ${currentCount}, Requested: ${used}` },
        { status: 400 }
      );
    }

    // Decrement the booster count in the nested boosters object
    const result = await gameScoreCollection.updateOne(
      { fid: fid },
      { 
        $inc: { 
          [`boosters.${boosterName}`]: -used 
        },
        $set: {
          lastUpdated: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch updated user data
    const updatedUser = await gameScoreCollection.findOne({ fid: fid });

    return NextResponse.json({
      success: true,
      message: `Successfully used ${used} ${boosterName} booster(s)`,
      data: {
        boosters: updatedUser?.boosters || {
          shuffle: 0,
          partyPopper: 0
        }
      }
    });

  } catch (error) {
    console.error('Error updating booster usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
