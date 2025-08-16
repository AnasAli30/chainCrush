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
  score: number; // All-time high (ATH) - only updated when beaten
  currentSeasonScore?: number; // Current season score - updated every game
  level: number;
  userAddress?: string;
  timestamp: number;
  duration?: number; // Game duration in seconds
  nftMinted?: boolean;
  nftName?: string;
  nftCount?: number; // Added for NFT tracking
  lastNftMint?: number; // Added for NFT tracking
  hasNft?: boolean; // Added for NFT tracking
  faucetClaimed?: boolean; // Added for faucet tracking
  hasMintedToday?: boolean; // Track if user has minted today
  lastMintDate?: string; // YYYY-MM-DD format of last mint date
}

export interface FaucetClaim {
  userAddress: string;
  amount: string;
  transactionHash: string;
  timestamp: number;
  blockNumber: number;
  walletIndex?: number; // Which wallet was used (1-5)
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
    const newScore = gameScore.score;
    
    // Check if this is a new all-time high (score field)
    const currentAth = existingPlayer.score || 0;
    const newAth = Math.max(currentAth, newScore);
    
    // Check if this is a new current season high
    const currentSeasonScore = existingPlayer.currentSeasonScore || 0;
    const newCurrentSeasonScore = Math.max(currentSeasonScore, newScore);
    
    // Prepare update fields
    const updateFields: any = {
      pfpUrl: gameScore.pfpUrl,
      username: gameScore.username,
      timestamp: gameScore.timestamp,
      updatedAt: new Date()
    };
    
    // Only update currentSeasonScore if it's a new season high
    if (newScore > currentSeasonScore) {
      updateFields.currentSeasonScore = newScore;
      // Only update duration when current season score improves
      if (gameScore.duration !== undefined) {
        updateFields.duration = gameScore.duration;
      }
    }
    
    // Only update score (ATH) if it's a new all-time high
    if (newScore > currentAth) {
      updateFields.score = newScore;
    }
    
    // Update level if it's higher than existing
    if (gameScore.level > (existingPlayer.level || 0)) {
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
    
    if (newScore > currentAth) {
      console.log(`Updated player ${gameScore.fid} with new ATH: ${newScore}, level: ${gameScore.level}`);
    } else if (newScore > currentSeasonScore) {
      console.log(`Updated player ${gameScore.fid} with new current season score: ${newScore}, level: ${gameScore.level}`);
    } else {
      console.log(`Updated player ${gameScore.fid} profile info - level: ${gameScore.level}`);
    }
  } else {
    // Create new player record with both scores initialized
    const newPlayerData = {
      ...gameScore,
      currentSeasonScore: gameScore.score,
      createdAt: new Date()
    };
    
    await db.collection('gameScores').insertOne(newPlayerData);
    console.log(`Created new player ${gameScore.fid} with score: ${gameScore.score}`);
  }
}

export async function getLeaderboard(limit: number = 50): Promise<GameScore[]> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const leaderboard = await db.collection('gameScores')
    .find({ 
      currentSeasonScore: { $exists: true },
      hasMintedToday: true,
      lastMintDate: today
    })
    .sort({ currentSeasonScore: -1 })
    .limit(limit)
    .toArray();
  
  return leaderboard as unknown as GameScore[];
}

export async function getUserBestScore(fid: number): Promise<GameScore | null> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const bestScore = await db.collection('gameScores')
    .findOne(
      { fid, currentSeasonScore: { $exists: true } },
      { sort: { currentSeasonScore: -1 } }
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

export async function getMixedLeaderboard(limit: number = 50, offset: number = 0): Promise<GameScore[]> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Get players with currentSeasonScore who have minted today, sorted by currentSeasonScore
  const allPlayers = await db.collection('gameScores')
    .find({ 
      currentSeasonScore: { $exists: true },
      hasMintedToday: true,
      lastMintDate: today
    })
    .sort({ currentSeasonScore: -1 })
    .toArray();
  
  // Remove duplicates by fid (keep highest currentSeasonScore for each user)
  const uniquePlayers = new Map();
  allPlayers.forEach(player => {
    const existing = uniquePlayers.get(player.fid);
    if (!existing || (player.currentSeasonScore || 0) > (existing.currentSeasonScore || 0)) {
      uniquePlayers.set(player.fid, player);
    }
  });
  
  const uniquePlayersList = Array.from(uniquePlayers.values()).sort((a, b) => (b.currentSeasonScore || 0) - (a.currentSeasonScore || 0));
  
  // Separate NFT holders and non-NFT holders
  const nftHolders = uniquePlayersList.filter(player => player.hasNft === true && player.nftCount > 0);
  const nonNftHolders = uniquePlayersList.filter(player => !player.hasNft || !player.nftCount || player.nftCount === 0);
  
  // Ensure top 10 are NFT holders, then add others
  const top10NftHolders = nftHolders.slice(0, 10);
  const remainingNftHolders = nftHolders.slice(10);
  
  // Combine remaining players and sort by currentSeasonScore
  const othersPool = [...remainingNftHolders, ...nonNftHolders].sort((a, b) => (b.currentSeasonScore || 0) - (a.currentSeasonScore || 0));
  
  // Final leaderboard: top 10 NFT holders + others
  const finalLeaderboard = [
    ...top10NftHolders,
    ...othersPool
  ];
  
  // Apply pagination (offset and limit)
  const paginatedResult = finalLeaderboard.slice(offset, offset + limit);
  
  // Additional deduplication check to ensure no duplicates in the result
  const seenFids = new Set();
  const deduplicatedResult = paginatedResult.filter(player => {
    if (seenFids.has(player.fid)) {
      console.log(`Duplicate FID found and removed: ${player.fid} (${player.username || 'Unknown'})`);
      return false;
    }
    seenFids.add(player.fid);
    return true;
  });
  
  // Log pagination info for debugging
  console.log(`getMixedLeaderboard: offset=${offset}, limit=${limit}, total=${finalLeaderboard.length}, returned=${deduplicatedResult.length}`);
  
  return deduplicatedResult as unknown as GameScore[];
}

export async function getTotalPlayersCount(): Promise<number> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Get unique player count by counting distinct fids who have currentSeasonScore and minted today
  const totalPlayers = await db.collection('gameScores').distinct('fid', { 
    currentSeasonScore: { $exists: true },
    hasMintedToday: true,
    lastMintDate: today
  });
  return totalPlayers.length;
}

// Faucet functions
export async function saveFaucetClaim(faucetData: FaucetClaim): Promise<void> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  // Save to faucet claims collection
  await db.collection('faucetClaims').insertOne({
    ...faucetData,
    createdAt: new Date()
  });
  
  // Also mark in gameScores that this user has claimed faucet
  await db.collection('gameScores').updateMany(
    { userAddress: faucetData.userAddress },
    { $set: { faucetClaimed: true } }
  );
}

export async function hasUserClaimedFaucet(userAddress: string): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  // Check in faucet claims collection
  const faucetClaim = await db.collection('faucetClaims').findOne({ userAddress });
  if (faucetClaim) {
    return true;
  }
  
  // Also check in gameScores collection
  const gameScore = await db.collection('gameScores').findOne({ 
    userAddress, 
    faucetClaimed: true 
  });
  
  return !!gameScore;
}

export async function getUserFaucetClaim(userAddress: string): Promise<FaucetClaim | null> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const faucetClaim = await db.collection('faucetClaims').findOne({ userAddress });
  return faucetClaim as FaucetClaim | null;
}

export async function getWalletUsageStats(): Promise<Array<{ walletIndex: number; usageCount: number; totalAmount: string }>> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const stats = await db.collection('faucetClaims').aggregate([
    {
      $group: {
        _id: '$walletIndex',
        usageCount: { $sum: 1 },
        totalAmount: { $sum: { $toDouble: '$amount' } }
      }
    },
    {
      $project: {
        walletIndex: '$_id',
        usageCount: 1,
        totalAmount: { $toString: '$totalAmount' }
      }
    },
    { $sort: { walletIndex: 1 } }
  ]).toArray();
  
  return stats as Array<{ walletIndex: number; usageCount: number; totalAmount: string }>;
}

// Migration function to update existing data with new scoring fields
export async function migrateToNewScoringSystem(): Promise<void> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  console.log('Starting migration to new scoring system...');
  
  // Find all documents that don't have currentSeasonScore field
  const documentsToUpdate = await db.collection('gameScores').find({
    currentSeasonScore: { $exists: false }
  }).toArray();
  
  console.log(`Found ${documentsToUpdate.length} documents to migrate`);
  
  for (const doc of documentsToUpdate) {
    const legacyScore = doc.score || 0;
    
    await db.collection('gameScores').updateOne(
      { _id: doc._id },
      {
        $set: {
          currentSeasonScore: legacyScore
        }
      }
    );
  }
  
  console.log('Migration completed successfully');
}

// Get all-time high leaderboard
export async function getAllTimeHighLeaderboard(limit: number = 50): Promise<GameScore[]> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const leaderboard = await db.collection('gameScores')
    .find({ 
      currentSeasonScore: { $exists: true },
      hasMintedToday: true,
      lastMintDate: today
    })
    .sort({ score: -1 })
    .limit(limit)
    .toArray();
  
  return leaderboard as unknown as GameScore[];
}

// Get user's game data by address
export async function getUserGameDataByAddress(userAddress: string): Promise<GameScore | null> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const userData = await db.collection('gameScores')
    .findOne(
      { userAddress: userAddress }
    );
  
  return userData as GameScore | null;
}

// Check if user has minted today
export async function hasUserMintedToday(userAddress: string): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const userData = await db.collection('gameScores')
    .findOne(
      { 
        userAddress: userAddress,
        hasMintedToday: true,
        lastMintDate: today
      }
    );
  
  return !!userData;
}

// Update user's daily mint status
export async function updateUserDailyMintStatus(userAddress: string, hasMinted: boolean = true): Promise<void> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  await db.collection('gameScores').updateMany(
    { userAddress: userAddress },
    {
      $set: {
        hasMintedToday: hasMinted,
        lastMintDate: today,
        updatedAt: new Date()
      }
    }
  );
}

// Reset daily mint status for all users (run daily)
export async function resetDailyMintStatus(): Promise<void> {
  const client = await clientPromise;
  const db = client.db('chaincrush');
  
  await db.collection('gameScores').updateMany(
    { hasMintedToday: true },
    {
      $set: {
        hasMintedToday: false,
        updatedAt: new Date()
      }
    }
  );
} 