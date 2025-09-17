'use client'

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWallet, 
  faCopy, 
  faUser, 
  faGem, 
  faCoins, 
  faCalendarDay,
  faTrophy,
  faHistory,
  faChartLine,
  faCheckCircle,
  faExternalLinkAlt,
  faRefresh,
  faShare,
  faGift
} from '@fortawesome/free-solid-svg-icons';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { useNFTSupply } from '@/hooks/use-nft-supply';
import { getAverageScore, getBestScore, getTotalGamesFromScores } from '@/lib/game-counter';
import { APP_URL } from '@/lib/constants';
import { authenticatedFetch } from '@/lib/auth';
import { motion } from 'framer-motion';


interface UserStats {
  userAddress: string;
  dailyMintCount: number;
  mintHistory: Array<{
    score: number;
    timestamp: number;
    trait?: string;
    tokenId?: number;
  }>;
  topScores: Array<{
    userAddress: string;
    score: number;
    timestamp: number;
  }>;
  dailyMintsRemaining: number;
  totalGamesPlayed?: number;
  averageScore?: number;
  bestScore?: number;
  totalNFTsMinted?: number;
  currentSeasonScore?: number | null;
  ath?: number | null;
  level?: number | null;
  hasMintedToday?: boolean;
  nftsByTrait?: {
    common: number;
    epic: number;
    rare: number;
    legendary: number;
  };
  giftBoxStats?: {
    totalArb: number;
    totalPepe: number;
    totalBoop: number;
    totalClaims: number;
    claimsToday: number;
    remainingClaims: number;
    lastGiftBoxUpdate?: string | null;
  };
}

export default function UserStats() {
  const { address } = useAccount();
  const { context, actions } = useMiniAppContext();
  const { formattedCurrentSupply, refetchAll } = useNFTSupply();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ethBalance, setEthBalance] = useState<string>('0.00');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [nftBalance, setNftBalance] = useState<number>(0);
  const [nftBalanceLoading, setNftBalanceLoading] = useState(false);
  const [localBestScore, setLocalBestScore] = useState<number | null>(null);
  const [localGamesPlayed, setLocalGamesPlayed] = useState<number>(0);
  const [localAverageScore, setLocalAverageScore] = useState<number>(0);
  const [localBestFromScores, setLocalBestFromScores] = useState<number>(0);
  const [totalGamesFromScores, setTotalGamesFromScores] = useState<number>(0);
  const [sharing, setSharing] = useState(false);
  const [shareRewardInfo, setShareRewardInfo] = useState<{
    canClaim: boolean;
    timeUntilNextShare: number;
    lastShareTime?: number;
  } | null>(null);

  // Get best score from localStorage
  const getBestScoreFromStorage = () => {
    if (typeof window !== 'undefined') {
      const storedScore = localStorage.getItem('candyBestScore');
      if (storedScore) {
        const score = parseInt(storedScore, 10);
        if (!isNaN(score) && score > 0) {
          setLocalBestScore(score);
          return;
        }
      }
    }
    setLocalBestScore(null);
  };

  // Get games played count from localStorage
  const getGamesPlayedFromStorage = () => {
    if (typeof window !== 'undefined') {
      const storedCount = localStorage.getItem('candyGamesPlayed');
      if (storedCount) {
        const count = parseInt(storedCount, 10);
        if (!isNaN(count) && count >= 0) {
          setLocalGamesPlayed(count);
          return;
        }
      }
    }
    setLocalGamesPlayed(0);
  };

  // Get calculated stats from scores
  const getCalculatedStats = () => {
    setLocalAverageScore(getAverageScore());
    setLocalBestFromScores(getBestScore());
    setTotalGamesFromScores(getTotalGamesFromScores());
  };

  // Get token amounts from localStorage (from GiftBox component)
  const getTokenAmountsFromStorage = (): { totalArb: number; totalPepe: number; totalBoop: number } | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      // Get token totals from localStorage (stored by GiftBox component)
      const totals = JSON.parse(localStorage.getItem('giftBoxTotals') || '{"arb": 0, "pepe": 0, "boop": 0, "totalClaims": 0}');
      
      console.log('Token amounts from localStorage (giftBoxTotals):', totals);
      
      // If no data found, add test data for demonstration
      if (totals.arb === 0 && totals.pepe === 0 && totals.boop === 0) {
        console.log('No token data found. You can add test data by running this in console:');
        console.log(`
localStorage.setItem('giftBoxTotals', JSON.stringify({
  "arb": 0,
  "pepe": 0, 
  "boop": 1545,
  "totalClaims": 3
}));
        `);
      }
      
      // If totals are empty, try to calculate from claims array
      if (totals.arb === 0 && totals.pepe === 0 && totals.boop === 0) {
        const claims = JSON.parse(localStorage.getItem('giftBoxClaims') || '[]');
        console.log('Totals empty, calculating from claims:', claims);
        
        if (claims.length > 0) {
          const calculatedTotals = {
            arb: 0,
            pepe: 0,
            boop: 0
          };
          
          claims.forEach((claim: any) => {
            if (claim.tokenType === 'arb') {
              calculatedTotals.arb += claim.amount || 0;
            } else if (claim.tokenType === 'pepe') {
              calculatedTotals.pepe += claim.amount || 0;
            } else if (claim.tokenType === 'boop') {
              calculatedTotals.boop += claim.amount || 0;
            }
          });
          
          console.log('Calculated token amounts from claims:', calculatedTotals);
          return {
            totalArb: calculatedTotals.arb,
            totalPepe: calculatedTotals.pepe,
            totalBoop: calculatedTotals.boop
          };
        }
      }
      
      return {
        totalArb: totals.arb || 0,
        totalPepe: totals.pepe || 0,
        totalBoop: totals.boop || 0
      };
    } catch (error) {
      console.error('Failed to get token amounts from localStorage:', error);
      return null;
    }
  };

  // Get gift box stats from API
  const getGiftBoxStatsFromAPI = async () => {
    console.log('getGiftBoxStatsFromAPI: Function called');
    if (!address) {
      console.log('No address, skipping gift box stats API call');
      return;
    }
    
    try {
      console.log('Fetching gift box stats from API...');
      const response = await fetch(`/api/claim-gift-box?userAddress=${address}&fid=${context?.user?.fid || ''}&stats=true`);
      const data = await response.json();
      
      console.log('API response:', data);
      
      if (data.success && data.stats) {
        const apiStats = {
          totalArb: data.stats.totalArb || 0,
          totalPepe: data.stats.totalPepe || 0,
          totalBoop: data.stats.totalBoop || 0,
          totalClaims: data.stats.totalClaims || 0,
          claimsToday: data.stats.claimsToday || 0,
          remainingClaims: data.stats.remainingClaims || 0,
          lastGiftBoxUpdate: data.stats.lastClaimTime ? new Date(data.stats.lastClaimTime + 12 * 60 * 60 * 1000).toISOString() : null
        };
        
        console.log('API stats:', apiStats);
        
        // Get token amounts from localStorage (from GiftBox component)
        const tokenAmounts = getTokenAmountsFromStorage();
        console.log('Token amounts from localStorage:', tokenAmounts);
        
        const giftBoxStats = {
          // Use API data for claims info (daily limits, remaining, etc.)
          totalClaims: apiStats.totalClaims,
          claimsToday: apiStats.claimsToday,
          remainingClaims: apiStats.remainingClaims,
          lastGiftBoxUpdate: apiStats.lastGiftBoxUpdate,
          // Use localStorage data for token amounts (from GiftBox claims)
          totalArb: tokenAmounts?.totalArb || 0,
          totalPepe: tokenAmounts?.totalPepe || 0,
          totalBoop: tokenAmounts?.totalBoop || 0
        };
        
        console.log('Combined gift box stats:', giftBoxStats);
        
        setStats(prevStats => {
          if (!prevStats) {
            // If no stats yet, create a minimal stats object with gift box data
            console.log('getGiftBoxStatsFromAPI: Creating new stats object with gift box data');
            return {
              userAddress: address,
              dailyMintCount: 0,
              mintHistory: [],
              topScores: [],
              dailyMintsRemaining: 5,
              giftBoxStats
            };
          }
          console.log('getGiftBoxStatsFromAPI: Updating existing stats with gift box data, prevStats:', prevStats);
          return {
            ...prevStats,
            giftBoxStats
          };
        });
      } else {
        console.log('API returned no stats, using localStorage token amounts only');
        // Use localStorage token amounts even if API has no stats
        const tokenAmounts = getTokenAmountsFromStorage();
        if (tokenAmounts) {
          const fallbackStats = {
            totalClaims: 0,
            claimsToday: 0,
            remainingClaims: 5,
            lastGiftBoxUpdate: null,
            totalArb: tokenAmounts.totalArb || 0,
            totalPepe: tokenAmounts.totalPepe || 0,
            totalBoop: tokenAmounts.totalBoop || 0
          };
          console.log('Using localStorage token amounts as fallback:', fallbackStats);
          setStats(prevStats => {
            if (!prevStats) {
              return {
                userAddress: address,
                dailyMintCount: 0,
                mintHistory: [],
                topScores: [],
                dailyMintsRemaining: 5,
                giftBoxStats: fallbackStats
              };
            }
            return {
              ...prevStats,
              giftBoxStats: fallbackStats
            };
          });
        }
      }
    } catch (error) {
      console.error('Failed to get gift box stats from API:', error);
      
      // Fallback to localStorage token amounts only if API fails
      const tokenAmounts = getTokenAmountsFromStorage();
      if (tokenAmounts) {
        const fallbackStats = {
          totalClaims: 0,
          claimsToday: 0,
          remainingClaims: 5,
          lastGiftBoxUpdate: null,
          totalArb: tokenAmounts.totalArb || 0,
          totalPepe: tokenAmounts.totalPepe || 0,
          totalBoop: tokenAmounts.totalBoop || 0
        };
        console.log('API failed, using localStorage token amounts:', fallbackStats);
        setStats(prevStats => {
          if (!prevStats) {
            return {
              userAddress: address,
              dailyMintCount: 0,
              mintHistory: [],
              topScores: [],
              dailyMintsRemaining: 5,
              giftBoxStats: fallbackStats
            };
          }
          return {
            ...prevStats,
            giftBoxStats: fallbackStats
          };
        });
      }
    }
  };

  // Refresh gift box stats (can be called after claiming)
  const refreshGiftBoxStats = () => {
    getGiftBoxStatsFromAPI();
  };

  // Listen for custom gift box claim events
  useEffect(() => {
    const handleGiftBoxClaim = () => {
      // Refresh gift box stats when a claim is made
      getGiftBoxStatsFromAPI();
    };

    // Listen for custom gift box claim events
    window.addEventListener('giftBoxClaimed', handleGiftBoxClaim);

    return () => {
      window.removeEventListener('giftBoxClaimed', handleGiftBoxClaim);
    };
  }, []);

  // Check share reward eligibility
  const checkShareRewardEligibility = async () => {
    if (!address || !context?.user?.fid) return;
    
    try {
      const response = await authenticatedFetch(`/api/share-reward?userAddress=${address}&fid=${context.user.fid}`);
      const result = await response.json();
      
      if (result.success) {
        setShareRewardInfo({
          canClaim: result.canClaim,
          timeUntilNextShare: result.timeUntilNextShare,
          lastShareTime: result.lastShareTime
        });
      }
    } catch (error) {
      console.error('Error checking share reward eligibility:', error);
    }
  };

  // Claim share reward
  const claimShareReward = async () => {
    if (!address || !context?.user?.fid) return;
    
    try {
      const response = await authenticatedFetch('/api/share-reward', {
        method: 'POST',
        body: JSON.stringify({
          userAddress: address,
          fid: context.user.fid
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh share reward info
        await checkShareRewardEligibility();
        // Show success message or update UI
        console.log('Share reward claimed successfully!');
      } else {
        console.error('Failed to claim share reward:', result.error);
      }
    } catch (error) {
      console.error('Error claiming share reward:', error);
    }
  };

  // Share stats function using Farcaster ComposerCast
  const shareStats = async () => {
    if (!actions) {
      console.error('Farcaster actions not available');
      return;
    }

    setSharing(true);
    try {
      // Build the stats message
      const statsArray = [];
      
      // Add NFT count
      if (nftBalance > 0) {
        statsArray.push(`🎨 ${nftBalance} NFTs`);
      }
      
      // Add games played
      if (localGamesPlayed > 0) {
        statsArray.push(`🎮 ${localGamesPlayed} Games`);
      }
      
      // Add best score
      const bestScore = Math.max(localBestScore || 0, localBestFromScores);
      if (bestScore > 0) {
        statsArray.push(`🏆 ${bestScore.toLocaleString()} Best Score`);
      }
      
      // Add average score
      if (localAverageScore > 0) {
        statsArray.push(`📊 ${localAverageScore.toLocaleString()} Avg Score`);
      }
      
      // Add token rewards if available
      const tokenAmounts = getTokenAmountsFromStorage();
      if (tokenAmounts && (tokenAmounts.totalArb > 0 || tokenAmounts.totalPepe > 0 || tokenAmounts.totalBoop > 0)) {
        const tokenRewards = [];
        if (tokenAmounts.totalArb > 0) {
          tokenRewards.push(`🟢 ${tokenAmounts.totalArb.toFixed(2)} ARB`);
        }
        if (tokenAmounts.totalPepe > 0) {
          tokenRewards.push(`🐸 ${tokenAmounts.totalPepe.toLocaleString()} PEPE`);
        }
        if (tokenAmounts.totalBoop > 0) {
          tokenRewards.push(`🎁 ${tokenAmounts.totalBoop.toLocaleString()} BOOP`);
        }
        if (tokenRewards.length > 0) {
          statsArray.push(`💰 ${tokenRewards.join(' + ')} Rewards`);
        }
      }
      
      // Add gift box claims if available
      if (stats && stats.giftBoxStats && stats.giftBoxStats.totalClaims > 0) {
        statsArray.push(`🎁 ${stats.giftBoxStats.totalClaims} Gift Box Claims`);
      }
      
      // Create the share message
      const statsText = statsArray.length > 0 ? statsArray.join(' • ') : 'Just started playing!';
      const username = context?.user?.username || 'ChainCrush Player';
      
      // Enhanced share message with token rewards
      const shareMessage = `just CRUSHED it on ChainCrush! 💪\n\n${statsText}\n\n🔥 Y'all think you can beat these stats? I'm waiting... 👀\n Drop your best score below and let's see who's really built different!\n\n💰 Daily rewards available! Claim your gift boxes and earn tokens! 🎁\n\n#ChainCrush #Web3Gaming #CryptoRewards`;
      
      await actions.composeCast({
        text: shareMessage,
        embeds: [APP_URL || "https://chain-crush-black.vercel.app/"]
      });
      
      // Claim share reward after successful share
      await claimShareReward();
      
    } catch (error) {
      console.error('Failed to share stats:', error);
    } finally {
      setSharing(false);
    }
  };



  // Helper function to copy address to clipboard
  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  // Fetch ETH balance using ethers.js
  const fetchEthBalance = async () => {
    if (!address) return;
    setBalanceLoading(true);
    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const balance = await provider.getBalance(address);
      const formattedBalance = ethers.formatEther(balance);
      // Format to 4 decimal places
      const roundedBalance = parseFloat(formattedBalance).toFixed(4);
      setEthBalance(roundedBalance);
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      setEthBalance('Error');
    } finally {
      setBalanceLoading(false);
    }
  };

  // Fetch NFT balance using contract balanceOf function
  const fetchNftBalance = async () => {
    if (!address) return;
    setNftBalanceLoading(true);
    try {
      const { ethers } = await import('ethers');
      const { CONTRACT_ADDRESSES, CHAINCRUSH_NFT_ABI } = await import('@/lib/contracts');
      
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.CHAINCRUSH_NFT, CHAINCRUSH_NFT_ABI, provider);
      
      const balance = await contract.balanceOf(address);
      setNftBalance(Number(balance));
    } catch (error) {
      console.error('Error fetching NFT balance:', error);
      setNftBalance(0);
    } finally {
      setNftBalanceLoading(false);
    }
  };

  // Fetch user stats function
  const fetchStats = async () => {
    console.log('fetchStats: Function called');
    if (!address) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/user-stats?userAddress=${address}`);
      const result = await response.json();
      
      if (result.success) {
        // Fix the remaining value calculation
        const data = result.data;
        const correctedRemaining = Math.max(0, 5 - (data.dailyMintCount || 0));
        setStats(prevStats => {
          console.log('fetchStats: Setting stats, prevStats.giftBoxStats:', prevStats?.giftBoxStats);
          return {
            ...data,
            dailyMintsRemaining: correctedRemaining,
            // Preserve existing giftBoxStats if they exist
            giftBoxStats: prevStats?.giftBoxStats
          };
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchStats(),
      refetchAll(),
      fetchEthBalance(),
      fetchNftBalance(),
      getGiftBoxStatsFromAPI() // Load gift box stats from API
    ]);
    getBestScoreFromStorage(); // This is synchronous, so no need to await
    getGamesPlayedFromStorage(); // This is synchronous, so no need to await
    getCalculatedStats(); // This is synchronous, so no need to await
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      if (address) {
        await Promise.all([
          fetchStats(),
          fetchEthBalance(),
          fetchNftBalance(),
          checkShareRewardEligibility(),
          getGiftBoxStatsFromAPI()
        ]);
      } else {
        // Even without address, try to load token amounts from localStorage
        const tokenAmounts = getTokenAmountsFromStorage();
        if (tokenAmounts) {
          const fallbackStats = {
            totalClaims: 0,
            claimsToday: 0,
            remainingClaims: 5,
            lastGiftBoxUpdate: null,
            totalArb: tokenAmounts.totalArb || 0,
            totalPepe: tokenAmounts.totalPepe || 0,
            totalBoop: tokenAmounts.totalBoop || 0
          };
          console.log('No address but found localStorage token amounts:', fallbackStats);
          setStats(prevStats => {
            if (!prevStats) {
              return {
                userAddress: '',
                dailyMintCount: 0,
                mintHistory: [],
                topScores: [],
                dailyMintsRemaining: 5,
                giftBoxStats: fallbackStats
              };
            }
            return {
              ...prevStats,
              giftBoxStats: fallbackStats
            };
          });
        }
      }
      // Always get best score and games played from localStorage regardless of wallet connection
      getBestScoreFromStorage();
      getGamesPlayedFromStorage();
      getCalculatedStats();
    };
    
    loadData();
  }, [address]);

  // Listen for localStorage changes to update best score and games played in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'candyBestScore') {
        getBestScoreFromStorage();
      } else if (e.key === 'candyGamesPlayed') {
        getGamesPlayedFromStorage();
      } else if (e.key === 'candyGameScores') {
        getCalculatedStats();
      } else if (e.key === 'giftBoxClaims' || e.key === 'giftBoxTotals') {
        // Refresh gift box stats when localStorage is updated
        getGiftBoxStatsFromAPI();
      }
    };

    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);

    // Also check periodically in case the values are updated in the same tab
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
      <div className="min-h-screen p-4 space-y-6">
        {/* Header Skeleton */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
            <div>
              <div className="w-48 h-8 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Wallet Address & Balance Skeleton */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-4 h-4 bg-white/20 rounded animate-pulse"></div>
              <div className="w-32 h-4 bg-white/20 rounded animate-pulse"></div>
              <div className="w-4 h-4 bg-white/20 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-white/20 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-white/20 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-white/20 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Stats Overview Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-gradient-to-r from-gray-200 to-gray-300 p-4 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="w-16 h-4 bg-gray-300 rounded mb-2 animate-pulse"></div>
                  <div className="w-12 h-6 bg-gray-300 rounded animate-pulse"></div>
                </div>
                <div className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Daily Mint Status Skeleton */}
        <div className="bg-gradient-to-r from-[#19adff] to-[#28374d] p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-32 h-6 bg-white bg-opacity-20 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="w-20 h-4 bg-white bg-opacity-20 rounded mx-auto mb-2 animate-pulse"></div>
              <div className="w-16 h-8 bg-white bg-opacity-20 rounded mx-auto animate-pulse"></div>
            </div>
            <div className="text-center">
              <div className="w-24 h-4 bg-white bg-opacity-20 rounded mx-auto mb-2 animate-pulse"></div>
              <div className="w-16 h-8 bg-white bg-opacity-20 rounded mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Recent Mints Skeleton */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div>
                    <div className="w-24 h-5 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Scores Skeleton */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div>
                    <div className="w-32 h-5 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-20 h-6 bg-gray-200 rounded mb-1 animate-pulse"></div>
                  <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
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
    <div className="min-h-screen p-4 space-y-6">
      {/* Header with User Profile */}
      <motion.div 
        className="text-center space-y-4 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center space-x-4 mb-4">
          {context?.user?.pfpUrl ? (
            <img 
              src={context.user.pfpUrl} 
              alt="Profile" 
              className="w-16 h-16 rounded-full border-4 border-[#19adff] shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#19adff] to-[#28374d] flex items-center justify-center border-4 border-white shadow-lg">
              <FontAwesomeIcon icon={faUser} className="text-2xl text-white" />
            </div>
          )}
                      <div>
              <h1 className="text-3xl font-bold text-white">
                {context?.user?.username || 'Player'}
              </h1>
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={refreshData}
                  disabled={refreshing}
                  className="flex items-center space-x-2 text-[#19adff] bg-white px-3 py-1 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  <FontAwesomeIcon icon={faRefresh} className={refreshing ? 'animate-spin' : ''} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                
              
              </div>
            </div>
        </div>
        
        {/* Wallet Address & Balance */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-center space-x-3">
            <FontAwesomeIcon icon={faWallet} className="text-[#19adff]" />
            <span className="text-white font-mono text-sm">
              {address?.slice(0, 8)}...{address?.slice(-8)}
            </span>
            <button
              onClick={copyAddress}
              className="text-[#19adff] hover:text-[#1590d4] transition-colors"
            >
              <FontAwesomeIcon 
                icon={copiedAddress ? faCheckCircle : faCopy} 
                className={copiedAddress ? 'text-green-400' : ''} 
              />
            </button>
          </div>
          
          {/* ETH Balance */}
          <div className="flex items-center justify-center space-x-2 text-white/80">
       
            <FontAwesomeIcon icon={faCoins} className="text-yellow-400" />
            <span className="text-sm">Balance:</span>
            {balanceLoading ? (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-white/40 rounded animate-pulse"></div>
                <div className="w-8 h-3 bg-white/40 rounded animate-pulse"></div>
              </div>
            ) : (
              <span className="font-bold text-yellow-400">
                {ethBalance}   <img src="/candy/arb.png" alt="" style={{width: '20px', height: '20px',display:"inline-block",margin:"0px 5px"}}/> ETH
              </span>
            )}
          </div>
        </div>
      </motion.div>

      <div className='rounded-[13px]' style={{width:"100%",border:"4px #7c65c1 solid"}}>
        <button
                  onClick={shareStats}
                  disabled={sharing || (shareRewardInfo?.canClaim === false)}
                  className="flex flex-col items-center justify-center space-y-1 text-purple-600 bg-white px-3 py-3 rounded-[10px] text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 w-full text-center"
                >
                  <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 256 256" fill="none">
                    <rect width="256" height="256" rx="56" fill="#7C65C1"></rect>
                    <path d="M183.296 71.68H211.968L207.872 94.208H200.704V180.224L201.02 180.232C204.266 180.396 206.848 183.081 206.848 186.368V191.488L207.164 191.496C210.41 191.66 212.992 194.345 212.992 197.632V202.752H155.648V197.632C155.648 194.345 158.229 191.66 161.476 191.496L161.792 191.488V186.368C161.792 183.081 164.373 180.396 167.62 180.232L167.936 180.224V138.24C167.936 116.184 150.056 98.304 128 98.304C105.944 98.304 88.0638 116.184 88.0638 138.24V180.224L88.3798 180.232C91.6262 180.396 94.2078 183.081 94.2078 186.368V191.488L94.5238 191.496C97.7702 191.66 100.352 194.345 100.352 197.632V202.752H43.0078V197.632C43.0078 194.345 45.5894 191.66 48.8358 191.496L49.1518 191.488V186.368C49.1518 183.081 51.7334 180.396 54.9798 180.232L55.2958 180.224V94.208H48.1278L44.0318 71.68H72.7038V54.272H183.296V71.68Z" fill="white"></path>
                  </svg>
                    <span>
                      {sharing ? 'Sharing...' : (() => {
                        const tokenAmounts = getTokenAmountsFromStorage();
                        const hasTokenRewards = tokenAmounts && (tokenAmounts.totalArb > 0 || tokenAmounts.totalPepe > 0 || tokenAmounts.totalBoop > 0);
                        return hasTokenRewards ? 'Share Rewards! 💰' : 'Share Stats';
                      })()}
                    </span>
                  </div>
                  
                  {/* Share Reward Info integrated in button */}
                  {shareRewardInfo && (
                    <div className="text-base">
                      {shareRewardInfo.canClaim ? (
                        <div className="text-green-600">
                          🎁 Share to earn +2 gift box claims!
                          {(() => {
                            const tokenAmounts = getTokenAmountsFromStorage();
                            const hasTokenRewards = tokenAmounts && (tokenAmounts.totalArb > 0 || tokenAmounts.totalPepe > 0 || tokenAmounts.totalBoop > 0);
                            return hasTokenRewards ? ' + Show off your rewards! 💰' : '';
                          })()}
                        </div>
                      ) : (
                        <div className="text-yellow-600">
                          ⏰ Next share Claim in {Math.ceil(shareRewardInfo.timeUntilNextShare / (1000 * 60 * 60))}h
                        </div>
                      )}
                    </div>
                  )}
        </button>
        </div>
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {/* Total NFTs */}
        <motion.div 
          className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl text-white shadow-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total NFTs</p>
              {nftBalanceLoading ? (
                <div className="flex items-center space-x-1">
                  <div className="w-8 h-6 bg-white/20 rounded animate-pulse"></div>
                </div>
              ) : (
                <p className="text-2xl font-bold">{nftBalance}</p>
              )}
            </div>
            <FontAwesomeIcon icon={faGem} className="text-2xl opacity-80" />
          </div>
        </motion.div>

        {/* Current Season Score - Show when available */}
        {stats?.currentSeasonScore && (
          <motion.div 
            className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-2xl text-white shadow-lg"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Current Season</p>
                <p className="text-2xl font-bold">
                  {stats.currentSeasonScore.toLocaleString()}
                </p>
              </div>
              <FontAwesomeIcon icon={faTrophy} className="text-2xl opacity-80" />
            </div>
          </motion.div>
        )}

        {/* All-Time High - Show when available */}
        {stats?.bestScore && (
          <motion.div 
            className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-2xl text-white shadow-lg"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">All-Time High</p>
                <p className="text-2xl font-bold">
                  {stats.bestScore.toLocaleString()}
                </p>
              </div>
              <FontAwesomeIcon icon={faTrophy} className="text-2xl opacity-80" />
            </div>
          </motion.div>
        )}

        {/* Best Score - Show the highest between localStorage and calculated scores (fallback) */}
        {!stats?.currentSeasonScore && !stats?.ath && (localBestScore !== null || localBestFromScores > 0) && (
          <motion.div 
            className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-2xl text-white shadow-lg"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Best Score</p>
                <p className="text-2xl font-bold">
                  {Math.max(localBestScore || 0, localBestFromScores).toLocaleString()}
                </p>
              </div>
              <FontAwesomeIcon icon={faTrophy} className="text-2xl opacity-80" />
            </div>
          </motion.div>
        )}

        {/* Games Played */}
        <motion.div 
          className="bg-gradient-to-r from-green-500 to-teal-500 p-4 rounded-2xl text-white shadow-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Games Played</p>
              <p className="text-2xl font-bold">{localGamesPlayed}</p>
             
            </div>
            <FontAwesomeIcon icon={faChartLine} className="text-2xl opacity-80" />
          </div>
        </motion.div>

        {/* Average Score - Only show if there are games played */}
        {localAverageScore > 0 && (
          <motion.div 
            className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-2xl text-white shadow-lg"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Average Score</p>
                <p className="text-2xl font-bold">{localAverageScore.toLocaleString()}</p>
              </div>
              <FontAwesomeIcon icon={faChartLine} className="text-2xl opacity-80" />
            </div>
          </motion.div>
        )}
      </div>


      {/* Daily Mint Status */}
      <motion.div 
        className="bg-gradient-to-r from-[#19adff] to-[#28374d] p-6 rounded-2xl text-white shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center space-x-2">
            <FontAwesomeIcon icon={faCalendarDay} />
            <span>Daily Mint Status</span>
          </h3>
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
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ maxWidth: `${((stats.dailyMintCount || 0) / 5) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Daily Mint Status Indicator */}
        <div className="mt-4 text-center">
          {stats.hasMintedToday ? (
            <div className="inline-flex items-center space-x-2 bg-green-500/20 px-3 py-2 rounded-full">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-400" />
              <span className="text-sm font-medium text-green-300">✅ Minted Today - Visible in Leaderboard</span>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-2 bg-yellow-500/20 px-3 py-2 rounded-full">
              <FontAwesomeIcon icon={faHistory} className="text-yellow-400" />
              <span className="text-sm font-medium text-yellow-300">⚠️ Not Minted Today - Hidden from Leaderboard</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Gift Box Analytics */}
      {(() => {
        const tokenAmounts = getTokenAmountsFromStorage();
        const hasTokenData = tokenAmounts && (tokenAmounts.totalArb > 0 || tokenAmounts.totalPepe > 0 || tokenAmounts.totalBoop > 0);
        const hasApiData = stats.giftBoxStats && (stats.giftBoxStats.claimsToday > 0 || stats.giftBoxStats.totalClaims > 0);
        
        // Show if we have either token data OR API data OR stats.giftBoxStats exists
        // Also show if we have any gift box related data at all
        const shouldShow = stats.giftBoxStats || hasTokenData || hasApiData || true; // Always show for now to debug
        
        const giftBoxData = stats.giftBoxStats || (hasTokenData ? {
          totalClaims: 0,
          claimsToday: 0,
          remainingClaims: 5,
          lastGiftBoxUpdate: null,
          totalArb: tokenAmounts?.totalArb || 0,
          totalPepe: tokenAmounts?.totalPepe || 0,
          totalBoop: tokenAmounts?.totalBoop || 0
        } : null);
        
        console.log('Gift Box Analytics render check:', { 
          hasStatsGiftBox: !!stats.giftBoxStats, 
          statsGiftBoxContent: stats.giftBoxStats,
          hasTokenData,
          hasApiData,
          shouldShow,
          tokenAmounts,
          giftBoxData,
          fullStatsObject: stats
        });
        return shouldShow;
      })() && (
        <motion.div 
          className="glass-card neon-glow p-6 rounded-2xl text-white shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(147, 51, 234, 0.15) 50%, rgba(0, 230, 118, 0.1) 100%)',
            border: '2px solid rgba(0, 255, 255, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 255, 255, 0.3), 0 0 30px rgba(147, 51, 234, 0.2)',
            backdropFilter: 'blur(20px)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center space-x-2">
              <FontAwesomeIcon icon={faGift} />
              <span>Gift Box Analytics</span>
            </h3>
            <div className="text-3xl">🎁</div>
          </div>

          {/* Daily Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.div 
              className="text-center p-4 rounded-xl"
              style={{
                background: 'rgba(0, 255, 255, 0.1)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <FontAwesomeIcon icon={faCalendarDay} className="text-cyan-400 text-xl" />
              </div>
              <p className="text-xs text-cyan-400 uppercase tracking-wider">Claims Today</p>
              <p className="text-2xl font-bold text-white">{stats.giftBoxStats?.claimsToday || 0}</p>
              <p className="text-xs text-white/60">/ 5 per period</p>
            </motion.div>
            
            <motion.div 
              className="text-center p-4 rounded-xl"
              style={{
                background: 'rgba(147, 51, 234, 0.1)',
                border: '1px solid rgba(147, 51, 234, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-purple-400 text-xl" />
              </div>
              <p className="text-xs text-purple-400 uppercase tracking-wider">Remaining</p>
              <p className="text-2xl font-bold text-white">{stats.giftBoxStats?.remainingClaims || 0}</p>
              <p className="text-xs text-white/60">boxes left</p>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-black/50 rounded-full h-2 border border-purple-400/20">
                  <div 
                    className="bg-gradient-to-r from-purple-400 to-cyan-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((stats.giftBoxStats?.remainingClaims || 0) / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="text-center p-4 rounded-xl"
              style={{
                background: 'rgba(0, 230, 118, 0.1)',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <FontAwesomeIcon icon={faHistory} className="text-green-400 text-xl" />
              </div>
              <p className="text-xs text-green-400 uppercase tracking-wider">Total Claims</p>
              <p className="text-2xl font-bold text-white">{stats.giftBoxStats?.totalClaims || 0}</p>
              <p className="text-xs text-white/60">all time</p>
            </motion.div>
          </div>

          {/* Reset Time Information */}
          {stats.giftBoxStats?.lastGiftBoxUpdate && (
            <motion.div 
              className="mb-6 p-4 rounded-lg"
              style={{
                background: 'rgba(0, 255, 255, 0.05)',
                border: '1px solid rgba(0, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center mb-2">
                <FontAwesomeIcon icon={faRefresh} className="text-cyan-400 mr-2" />
                <span className="text-sm text-cyan-400 font-medium">Next Reset</span>
              </div>
              <p className="text-center text-white/80 text-sm">
                {(() => {
                  const now = new Date();
                  const lastUpdate = stats.giftBoxStats?.lastGiftBoxUpdate;
                  const resetTime = lastUpdate ? new Date(lastUpdate) : new Date();
                  const timeDiff = resetTime.getTime() - now.getTime();
                  
                  if (timeDiff <= 0) {
                    return "Available now!";
                  }
                  
                  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
                  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                  
                  if (hours > 0) {
                    return `${hours}h ${minutes}m remaining`;
                  } else {
                    return `${minutes}m remaining`;
                  }
                })()}
              </p>
            </motion.div>
          )}

          {/* Token Rewards Summary */}
          <div className="border-t border-cyan-400/20 pt-4">
            <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3">Total Rewards Collected</h4>
            <div className="grid grid-cols-3 gap-4">
              <motion.div 
                className="text-center p-3 rounded-lg"
                style={{
                  background: 'rgba(0, 255, 255, 0.05)',
                  border: '1px solid rgba(0, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-8 h-8 mx-auto mb-1">
                  <img src="/candy/arb.png" alt="ARB" className="w-full h-full object-contain" />
                </div>
                <p className="text-xs text-cyan-400">ARB</p>
                <p className="text-lg font-bold text-white">{(stats.giftBoxStats?.totalArb || 0).toFixed(3)}</p>
              </motion.div>
              <motion.div 
                className="text-center p-3 rounded-lg"
                style={{
                  background: 'rgba(147, 51, 234, 0.05)',
                  border: '1px solid rgba(147, 51, 234, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-8 h-8 mx-auto mb-1">
                  <img src="/candy/2.png" alt="PEPE" className="w-full h-full object-contain" />
                </div>
                <p className="text-xs text-purple-400">PEPE</p>
                <p className="text-lg font-bold text-white">{(stats.giftBoxStats?.totalPepe || 0).toLocaleString()}</p>
              </motion.div>
              <motion.div 
                className="text-center p-3 rounded-lg"
                style={{
                  background: 'rgba(0, 230, 118, 0.05)',
                  border: '1px solid rgba(0, 230, 118, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-8 h-8 mx-auto mb-1">
                  <img src="/candy/1.png" alt="BOOP" className="w-full h-full object-contain" />
                </div>
                <p className="text-xs text-green-400">BOOP</p>
                <p className="text-lg font-bold text-white">{(stats.giftBoxStats?.totalBoop || 0).toLocaleString()}</p>
              </motion.div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-10 h-[1px] bg-cyan-400/30" />
          <div className="absolute top-0 right-0 h-10 w-[1px] bg-cyan-400/30" />
        </motion.div>
      )}

      {/* NFT Collection Overview */}
      {stats.nftsByTrait && (
        <motion.div 
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
              <FontAwesomeIcon icon={faGem} className="text-[#19adff]" />
              <span>NFT Collection</span>
            </h3>
            <span className="text-sm text-gray-500">Total Supply: {formattedCurrentSupply}</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-100 rounded-xl">
              <div className="text-2xl mb-2">⚪</div>
              <p className="text-sm text-gray-600">Common</p>
              <p className="text-xl font-bold text-gray-800">{stats.nftsByTrait.common || 0}</p>
            </div>
            <div className="text-center p-4 bg-purple-100 rounded-xl">
              <div className="text-2xl mb-2">🟣</div>
              <p className="text-sm text-purple-600">Epic</p>
              <p className="text-xl font-bold text-purple-800">{stats.nftsByTrait.epic || 0}</p>
            </div>
            <div className="text-center p-4 bg-yellow-100 rounded-xl">
              <div className="text-2xl mb-2">🟡</div>
              <p className="text-sm text-yellow-600">Rare</p>
              <p className="text-xl font-bold text-yellow-800">{stats.nftsByTrait.rare || 0}</p>
            </div>
            <div className="text-center p-4 bg-red-100 rounded-xl">
              <div className="text-2xl mb-2">🔴</div>
              <p className="text-sm text-red-600">Legendary</p>
              <p className="text-xl font-bold text-red-800">{stats.nftsByTrait.legendary || 0}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Mints */}
      <motion.div 
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <div className="flex items-center space-x-3 mb-4">
          <FontAwesomeIcon icon={faHistory} className="text-[#19adff] text-xl" />
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
              <motion.div 
                key={index} 
                className="flex justify-between items-center p-4 bg-gradient-to-r from-[#19adff] to-[#28374d] rounded-xl border border-[#19adff]"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🏆</div>
                  <div>
                    <p className="font-bold text-white">Score: {(mint.score || 0).toLocaleString()}</p>
                    <p className="text-sm text-white opacity-80">
                      {new Date(mint.timestamp * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {mint.tokenId && (
                      <p className="text-xs text-white opacity-70">Token #{mint.tokenId}</p>
                    )}
                  </div>
                </div>
                {mint.trait && (
                  <span className="px-3 py-1 text-sm rounded-full bg-white text-[#19adff] font-medium">
                    {mint.trait}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      
    </div>
  );
} 