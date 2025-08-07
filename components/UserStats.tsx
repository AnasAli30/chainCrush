'use client'

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface UserStats {
  userAddress: string;
  dailyMintCount: number;
  mintHistory: Array<{
    score: number;
    timestamp: number;
    trait?: string;
  }>;
  topScores: Array<{
    userAddress: string;
    score: number;
    timestamp: number;
  }>;
  dailyMintsRemaining: number;
}

export default function UserStats() {
  const { address } = useAccount();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/user-stats?userAddress=${address}`);
        const result = await response.json();
        
        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [address]);

  if (!address) {
    return (
      <div className="p-4 text-center">
        <p>Please connect your wallet to view your stats</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p>Loading your stats...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 text-center">
        <p>No stats available</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Your ChainCrush Stats</h2>
      
      {/* Daily Mint Status */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 rounded-lg text-white">
        <h3 className="text-lg font-semibold mb-2">Daily Mint Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm opacity-90">Mints Today</p>
            <p className="text-2xl font-bold">{stats.dailyMintCount}/5</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Remaining</p>
            <p className="text-2xl font-bold">{stats.dailyMintsRemaining}</p>
          </div>
        </div>
      </div>

      {/* Recent Mints */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Recent Mints</h3>
        {stats.mintHistory.length === 0 ? (
          <p className="text-gray-500">No mints yet. Play the game to earn NFTs!</p>
        ) : (
          <div className="space-y-2">
            {stats.mintHistory.slice(0, 5).map((mint, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">Score: {mint.score}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(mint.timestamp * 1000).toLocaleDateString()}
                  </p>
                </div>
                {mint.trait && (
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {mint.trait}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Scores */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Top Scores</h3>
        <div className="space-y-2">
          {stats.topScores.map((score, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                <div>
                  <p className="font-medium">
                    {score.userAddress === address ? 'You' : `${score.userAddress.slice(0, 6)}...${score.userAddress.slice(-4)}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(score.timestamp * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-lg font-bold text-pink-600">{score.score}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 