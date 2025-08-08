'use client'

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faMedal, faAward, faInfoCircle, faCoins } from '@fortawesome/free-solid-svg-icons';

interface LeaderboardEntry {
  fid: number;
  pfpUrl: string;
  username?: string;
  score: number;
  level: number;
  timestamp: number;
  nftMinted?: boolean;
  nftName?: string;
  nftCount?: number;
}

export default function Leaderboard() {
  const { address } = useAccount();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [showRewardInfo, setShowRewardInfo] = useState(false);
  // New timer states
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number }>({ days: 0, hours: 0 });
  const [timerLoading, setTimerLoading] = useState<boolean>(false);
  const [timer, setTimer] = useState<number | null>(null); // Unix seconds

  // Reward pool (PEPE)
  const POOL_PEPE = 4453630; // raw pool amount
  const formatMillions = (n: number) => `${(n / 1_000_000).toFixed(2)}M`;
  const poolDisplay = `${formatMillions(POOL_PEPE)} PEPE Pool`;
  // Top 10 distribution: 1st, 2nd, 3rd distinct; 4–6 equal; 7–8 equal; 9–10 equal (sums to 100)
  const DISTRIBUTION = [25, 18, 13, 8, 8, 8, 6, 6, 4, 4];
  const distributionAmounts = DISTRIBUTION.map((pct) => Math.round((POOL_PEPE * pct) / 100));
  const firstAmt = distributionAmounts[0];
  const secondAmt = distributionAmounts[1];
  const thirdAmt = distributionAmounts[2];
  const per4to6 = distributionAmounts[3];
  const per7to8 = distributionAmounts[6];
  const per9to10 = distributionAmounts[8];

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/game-leaderboard?limit=100');
        const result = await response.json();
        
        if (result.success) {
          setLeaderboard(result.data.leaderboard);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Fallback shows 0d 0h when no timer is available
 

  // Fetch timer from API (using existing /api/time route)
  useEffect(() => {
    setTimerLoading(true);
    fetch('/api/time')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setTimer(data.data.time); // unix seconds
        } else {
          setTimer(null);
        }
      })
      .catch(() => setTimer(null))
      .finally(() => setTimerLoading(false));
  }, []);

  // Drive timeLeft from API timer when present
  useEffect(() => {
    if (!timer) return;
    const target = Number(timer) * 1000; // convert to ms
    const update = () => {
      const now = Date.now();
      let diff = target - now;
      if (diff < 0) diff = 0;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeft({ days, hours });
    };
    update();
    const interval = setInterval(update, 60 * 1000); // update every minute
    return () => clearInterval(interval);
  }, [timer]);

  const displayTime = timerLoading ? '...' : `${timeLeft.days}d ${timeLeft.hours}h`;

  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100" style={{width:"130%",marginLeft:"-15%"}}>
          {/* Stats Skeleton */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="w-16 h-8 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                <div className="w-20 h-4 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="text-center">
                <div className="w-20 h-8 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                <div className="w-24 h-4 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Leaderboard Entries Skeleton */}
          <div className="space-y-3">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="flex items-center p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-gray-300 animate-pulse"></div>
                  </div>
                  <div className="flex-1">
                    <div className="w-24 h-5 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-16 h-6 bg-gray-200 rounded mb-1 animate-pulse"></div>
                  <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="  ">
      {/* Header */}
      

      {/* Reward Countdown Section (Dark Glass Header) */}
      <div
        className="mb-6"
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '12px 20px',
            width: '110%',
            marginLeft: '-5%',
            border: '2px solid rgba(59, 130, 246, 0.3)'
          }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)'
              }}
              onClick={() => setShowRewardInfo(true)}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              aria-label="Reward info"
            >
              <img src="/candy/2.png" alt="rewards"  />
            </div>
            <div>
              <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: 600 }}>{poolDisplay}</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>Click PEPE for details</div>
            </div>
          </div>

          <div className="text-right">
            <div style={{ color: '#ffffff', fontSize: '12px', opacity: 0.8 }}>Ends in</div>
            <div style={{ color: '#ffffff', fontFamily: 'monospace', fontSize: '16px', fontWeight: 700 }}>{displayTime}</div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl p-2  shadow-lg border border-gray-100" style={{width:"105%",marginLeft:"-3%"}}>
       

              {/* Stats */}
       <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-gray-100">
         <div className="flex items-center space-x-3 mb-4">
           <div className="text-2xl">📊</div>
           <h3 className="text-xl font-bold text-[#19adff]">Leaderboard Stats</h3>
         </div>
         <div className="grid grid-cols-2 gap-4">
           <div className="text-center">
             <p className="text-2xl font-bold text-[#19adff]">{leaderboard.length}</p>
             <p className="text-sm text-[#28374d]">Total Players</p>
           </div>
           <div className="text-center">
             <p className="text-2xl font-bold text-[#19adff]">
               {leaderboard.length > 0 ? leaderboard[0].score.toLocaleString() : '0'}
             </p>
             <p className="text-sm text-[#28374d]">Highest Score</p>
           </div>
         </div>
       </div>
        
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎮</div>
            <p className="text-gray-500 font-medium">No scores yet. Be the first to play!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div key={index} className="flex items-center p-4 bg-gradient-to-r from-[#19adff] to-[#28374d] rounded-xl border border-[#19adff]">
                {/* Rank */}
              

                                 {/* Profile Picture with Rank Badge */}
                 <div className="flex items-center space-x-3 flex-1">
                   <div className="relative">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#19adff]">
                       <img 
                         src={entry.pfpUrl} 
                         alt={`FID ${entry.fid}`}
                         className="w-full h-full object-cover"
                         onError={(e) => {
                           e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGRkYwQjMiLz4KPHN2ZyB4PSIxMCIgeT0iMTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRkY2OUI0Ij4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDEgMC04LTMuNTktOC04czMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4eiIvPgo8cGF0aCBkPSJNMTIgNmMtMy4zMSAwLTYgMi42OS02IDZzMi42OSA2IDYgNiA2LTIuNjkgNi02LTIuNjktNi02LTZ6bTAgMTBjLTIuMjEgMC00LTEuNzktNC00czEuNzktNCA0LTQgNCAxLjc5IDQgNC0xLjc5IDQtNCA0eiIvPgo8L3N2Zz4KPC9zdmc+';
                         }}
                       />
                     </div>
                     
                     {/* Rank Badge */}
                     <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                       {index === 0 && (
                         <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white">
                           <FontAwesomeIcon icon={faTrophy} className="text-xs" />
                         </div>
                       )}
                       {index === 1 && (
                         <div className="w-6 h-6 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white">
                           <FontAwesomeIcon icon={faMedal} className="text-xs" />
                         </div>
                       )}
                       {index === 2 && (
                         <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-yellow-600 rounded-full flex items-center justify-center text-white">
                           <FontAwesomeIcon icon={faAward} className="text-xs" />
                         </div>
                       )}
                       {index > 2 && (
                         <div className="w-6 h-6 bg-white text-[#19adff] rounded-full flex items-center justify-center font-bold">
                           #{index + 1}
                         </div>
                       )}
                     </div>
                   </div>
                  
                  {/* Player Info */}
                  <div className="flex-1">
                    <p className="font-bold text-white">
                      {entry.username || `${entry.fid}`}
                    </p>
                    <p className="text-sm text-white opacity-80">
                      Level {entry.level}
                    </p>
                    <p className="text-sm text-white opacity-80">
                      {new Date(entry.timestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    {entry.nftCount && entry.nftCount > 0 && (
                      <p className="text-xs text-yellow-300 font-medium">
                        🎨 {entry.nftCount} NFT{entry.nftCount > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{entry.score.toLocaleString()}</p>
                  <p className="text-xs text-white opacity-80">points</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reward Info Popup Modal */}
      {showRewardInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setShowRewardInfo(false)}>
          <div className="rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100" style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(59, 130, 246, 0.3)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center space-x-2" style={{ color: '#e5e7eb' }}>
                <FontAwesomeIcon icon={faCoins} className="text-yellow-400" />
                <span>Daily Rewards</span>
              </h3>
              <button
                onClick={() => setShowRewardInfo(false)}
                className="p-2 rounded-full transition-colors duration-200"
                style={{ color: '#9ca3af' }}
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faInfoCircle} className="text-lg" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <h4 className="font-bold mb-3 text-center" style={{ color: '#e5e7eb' }}>Top 10 Players Get Rewards</h4>
                <div className="space-y-2 text-sm">
                  {/* Top 3 distinct */}
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                    <span className="font-bold" style={{ color: '#fde68a' }}>🥇 1st Place (25%)</span>
                    <span className="font-bold" style={{ color: '#93c5fd' }}>{firstAmt.toLocaleString()} PEPE</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                    <span className="font-bold" style={{ color: '#e5e7eb' }}>🥈 2nd Place (18%)</span>
                    <span className="font-bold" style={{ color: '#93c5fd' }}>{secondAmt.toLocaleString()} PEPE</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                    <span className="font-bold" style={{ color: '#fdba74' }}>🥉 3rd Place (13%)</span>
                    <span className="font-bold" style={{ color: '#93c5fd' }}>{thirdAmt.toLocaleString()} PEPE</span>
                  </div>
                  {/* Batches */}
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                    <span className="font-bold" style={{ color: '#cbd5e1' }}>4th–6th Place (8% each)</span>
                    <span className="font-bold" style={{ color: '#93c5fd' }}>{per4to6.toLocaleString()} PEPE each</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                    <span className="font-bold" style={{ color: '#cbd5e1' }}>7th–8th Place (6% each)</span>
                    <span className="font-bold" style={{ color: '#93c5fd' }}>{per7to8.toLocaleString()} PEPE each</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                    <span className="font-bold" style={{ color: '#cbd5e1' }}>9th–10th Place (4% each)</span>
                    <span className="font-bold" style={{ color: '#93c5fd' }}>{per9to10.toLocaleString()} PEPE each</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xs mb-2" style={{ color: '#94a3b8' }}>⏰ Rewards distributed daily at midnight UTC</p>
                <p className="text-xs" style={{ color: '#64748b' }}>Pool: {POOL_PEPE.toLocaleString()} PEPE ({formatMillions(POOL_PEPE)})</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowRewardInfo(false)}
                className="px-6 py-2 font-bold rounded-lg transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', color: '#ffffff' }}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
       
    </div>
  );
}
