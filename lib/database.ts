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
  
  return mints as UserMint[];
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