import clientPromise from './mongodb';

export interface UserMint {
  userAddress: string;
  score: number;
  timestamp: number;
  tokenId?: number;
  trait?: string;
  signature: string;
}

export interface DailyMintCount {
  userAddress: string;
  date: string; // YYYY-MM-DD format
  count: number;
  lastMintTime: number;
}

export interface GameScore {
  fid: number;
  pfpUrl: string;
  username?: string;
  score: number;
  level: number;
  userAddress?: string;
  timestamp: number;
  nftMinted?: boolean;
  nftName?: string;
  nftCount?: number; // Added for NFT tracking
  lastNftMint?: number; // Added for NFT tracking
  hasNft?: boolean; // Added for NFT tracking
}

export interface UsedAuthKey {
  fusedKey: string;
  randomString: string;
  timestamp: number;
  ipAddress: string;
  createdAt: Date;
}

// Authentication key management functions
export async function isAuthKeyUsed(fusedKey: string): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const usedKey = await db.collection('usedAuthKeys').findOne({ fusedKey });
  return !!usedKey;
}

export async function storeUsedAuthKey(authKeyData: Omit<UsedAuthKey, 'createdAt'>): Promise<void> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  await db.collection('usedAuthKeys').insertOne({
    ...authKeyData,
    createdAt: new Date()
  });
}

export async function cleanupOldAuthKeys(): Promise<void> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  // Remove keys older than 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  await db.collection('usedAuthKeys').deleteMany({
    createdAt: { $lt: twentyFourHoursAgo }
  });
}

// Optional database validation for critical operations
export async function validateAuthKeyInDatabase(fusedKey: string, randomString: string): Promise<boolean> {
  try {
    const isUsed = await isAuthKeyUsed(fusedKey);
    if (isUsed) {
      return false;
    }
    
    // Store the key for future validation
    await storeUsedAuthKey({
      fusedKey,
      randomString,
      timestamp: Date.now(),
      ipAddress: 'unknown' // Will be set by the calling API route
    });
    
    return true;
  } catch (error) {
    console.error('Database validation error:', error);
    return false;
  }
}

export async function getUserDailyMintCount(userAddress: string): Promise<number> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const dailyCount = await db.collection('dailyMints').findOne({
    userAddress: userAddress.toLowerCase(),
    date: today
  });
  
  return dailyCount?.count || 0;
}

export async function incrementDailyMintCount(userAddress: string): Promise<void> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const today = new Date().toISOString().split('T')[0];
  const now = Date.now();
  
  await db.collection('dailyMints').updateOne(
    {
      userAddress: userAddress.toLowerCase(),
      date: today
    },
    {
      $inc: { count: 1 },
      $set: { lastMintTime: now },
      $setOnInsert: { userAddress: userAddress.toLowerCase(), date: today }
    },
    { upsert: true }
  );
}

export async function canUserMint(userAddress: string, dailyLimit: number = 5): Promise<boolean> {
  const currentCount = await getUserDailyMintCount(userAddress);
  return currentCount < dailyLimit;
}

export async function saveUserMint(mintData: UserMint): Promise<void> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  await db.collection('userMints').insertOne({
    ...mintData,
    userAddress: mintData.userAddress.toLowerCase(),
    createdAt: new Date()
  });
}

export async function getUserMintHistory(userAddress: string, limit: number = 50): Promise<UserMint[]> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const mints = await db.collection('userMints')
    .find({ userAddress: userAddress.toLowerCase() })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  
  return mints as unknown as UserMint[];
}

export async function getTotalMints(): Promise<number> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  return await db.collection('userMints').countDocuments();
}

export async function getTodayMints(): Promise<number> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return await db.collection('userMints').countDocuments({
    timestamp: { $gte: today.getTime() }
  });
}

export async function getTopScores(limit: number = 10): Promise<Array<{ userAddress: string; score: number; timestamp: number }>> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const topScores = await db.collection('userMints')
    .find({})
    .sort({ score: -1 })
    .limit(limit)
    .project({ userAddress: 1, score: 1, timestamp: 1 })
    .toArray();
  
  return topScores as Array<{ userAddress: string; score: number; timestamp: number }>;
}

export async function saveGameScore(gameScore: GameScore): Promise<void> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  // Check if player already exists
  const existingPlayer = await db.collection('gameScores').findOne({ fid: gameScore.fid });
  
  if (existingPlayer) {
    // Update player's best score if current score is higher
    if (gameScore.score > existingPlayer.score) {
      await db.collection('gameScores').updateOne(
        { fid: gameScore.fid },
        {
          $set: {
            pfpUrl: gameScore.pfpUrl,
            username: gameScore.username,
            score: gameScore.score,
            level: gameScore.level,
            userAddress: gameScore.userAddress,
            timestamp: gameScore.timestamp,
            updatedAt: new Date()
          }
        }
      );
      console.log(`Updated player ${gameScore.fid} with new best score: ${gameScore.score}, level: ${gameScore.level}`);
    } else {
      // Even if score isn't higher, update level and userAddress if provided
      const updateFields: any = {
        pfpUrl: gameScore.pfpUrl,
        username: gameScore.username,
        updatedAt: new Date()
      };
      
      // Update level if it's higher than existing
      if (gameScore.level > existingPlayer.level) {
        updateFields.level = gameScore.level;
      }
      
      // Always update userAddress if provided
      if (gameScore.userAddress) {
        updateFields.userAddress = gameScore.userAddress;
      }
      
      await db.collection('gameScores').updateOne(
        { fid: gameScore.fid },
        { $set: updateFields }
      );
      console.log(`Updated player ${gameScore.fid} profile info - level: ${gameScore.level}, address: ${gameScore.userAddress}`);
    }
  } else {
    // Create new player record
    await db.collection('gameScores').insertOne({
      ...gameScore,
      createdAt: new Date()
    });
    console.log(`Created new player ${gameScore.fid} with score: ${gameScore.score}`);
  }
}

export async function getLeaderboard(limit: number = 50): Promise<GameScore[]> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const leaderboard = await db.collection('gameScores')
    .find({})
    .sort({ score: -1 })
    .limit(limit)
    .toArray();
  
  return leaderboard as unknown as GameScore[];
}

export async function getUserBestScore(fid: number): Promise<GameScore | null> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const bestScore = await db.collection('gameScores')
    .findOne(
      { fid },
      { sort: { score: -1 } }
    );
  
  return bestScore as GameScore | null;
} 

// NFT minting tracking functions
export async function incrementUserNftCount(fid: number): Promise<void> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  await db.collection('gameScores').updateOne(
    { fid },
    { 
      $inc: { nftCount: 1 },
      $set: { lastNftMint: Date.now() }
    },
    { upsert: true }
  );
}

export async function getUserNftCount(fid: number): Promise<number> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const userData = await db.collection('gameScores').findOne({ fid });
  return userData?.nftCount || 0;
}

export async function updateUserNftInfo(fid: number, nftName: string): Promise<void> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  await db.collection('gameScores').updateOne(
    { fid },
    { 
      $set: { 
        nftName,
        hasNft: true,
        lastNftMint: Date.now()
      }
    },
    { upsert: true }
  );
}

export async function getLeaderboardWithNfts(limit: number = 50): Promise<GameScore[]> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  // Get all game scores with NFT data, filter out users without NFTs
  const leaderboard = await db.collection('gameScores')
    .find({ hasNft: true }) // Only get users who have minted NFTs
    .sort({ score: -1 })
    .limit(limit)
    .toArray();
  
  return leaderboard as unknown as GameScore[];
} 