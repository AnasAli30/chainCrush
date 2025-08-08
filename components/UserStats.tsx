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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🔗</div>
          <h2 className="text-2xl font-bold text-gray-800">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to view your stats</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <h2 className="text-2xl font-bold text-white-800">Loading Stats</h2>
          <p className="text-white-800">Fetching your ChainCrush statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-800">No Stats Available</h2>
          <p className="text-gray-600">Start playing to generate your statistics!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 space-y-6 ">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-4xl font-bold text-white">📊 Your Stats</h1>
        <p className="text-white">Track your ChainCrush performance</p>
      </div>
      
      {/* Daily Mint Status */}
      <div className="bg-gradient-to-r from-[#19adff] to-[#28374d] p-6 rounded-2xl text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">🎴 Daily Mint Status</h3>
          <div className="text-3xl">🎯</div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-sm opacity-90 mb-1">Mints Today</p>
            <p className="text-3xl font-bold">{stats.dailyMintCount}/5</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90 mb-1">Remaining</p>
            <p className="text-3xl font-bold">{stats.dailyMintsRemaining}</p>
          </div>
        </div>
      </div>

      {/* Recent Mints */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="text-2xl">🎴</div>
          <h3 className="text-xl font-bold text-gray-800">Recent Mints</h3>
        </div>
        {stats.mintHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎮</div>
            <p className="text-gray-500 font-medium">No mints yet. Play the game to earn NFTs!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.mintHistory.slice(0, 5).map((mint, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-[#19adff] to-[#28374d] rounded-xl border border-[#19adff]">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🏆</div>
                  <div>
                    <p className="font-bold text-white">Score: {mint.score.toLocaleString()}</p>
                    <p className="text-sm text-white opacity-80">
                      {new Date(mint.timestamp * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                {mint.trait && (
                  <span className="px-3 py-1 text-sm rounded-full bg-white text-[#19adff] font-medium">
                    {mint.trait}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Scores */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="text-2xl">🏆</div>
          <h3 className="text-xl font-bold text-gray-800">Top Scores</h3>
        </div>
        <div className="space-y-3">
                      {stats.topScores.map((score, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-[#19adff] to-[#28374d] rounded-xl border border-[#19adff]">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-white text-[#19adff] font-bold text-sm rounded-full">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-bold text-white">
                      {score.userAddress === address ? 'You' : `${score.userAddress.slice(0, 6)}...${score.userAddress.slice(-4)}`}
                    </p>
                    <p className="text-sm text-white opacity-80">
                      {new Date(score.timestamp * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{score.score.toLocaleString()}</p>
                  <p className="text-xs text-white opacity-80">points</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
} 