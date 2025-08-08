'use client'

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faMedal, faAward } from '@fortawesome/free-solid-svg-icons';

interface LeaderboardEntry {
  fid: number;
  pfpUrl: string;
  username?: string;
  score: number;
  level: number;
  timestamp: number;
}

export default function Leaderboard() {
  const { address } = useAccount();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4 animate-pulse">🏆</div>
          <h2 className="text-2xl font-bold text-white-800">Loading Leaderboard</h2>
          <p className="text-white-600">Fetching the top players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="  ">
      {/* Header */}
      

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl p-2  shadow-lg border border-gray-100" style={{width:"130%",marginLeft:"-15%"}}>
       
aZC
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
                      Level {entry.level}</p>
                      
                      <p className="text-sm text-white opacity-80" > {new Date(entry.timestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
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

       
    </div>
  );
}
