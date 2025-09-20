'use client'

import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faHome, faImages, faChartBar, faTrophy, faPlay, faRocket, 
  faCrown, faCoins, faBolt, faGem, faFire, faUsers,
  faArrowRight, faStar, faChartLine, faGamepad
} from '@fortawesome/free-solid-svg-icons'
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { useNFTSupply } from '@/hooks/use-nft-supply';
import { incrementGamesPlayed } from '@/lib/game-counter';

import { FarcasterActions } from '@/components/Home/FarcasterActions'
import { User } from '@/components/Home/User'
import { WalletActions } from '@/components/Home/WalletActions'
import { NotificationActions } from './NotificationActions'
import { ThemeToggle } from '@/components/ThemeToggle'
import NFTManager from '../NFTManager'
import UserStats from '../UserStats'
import Leaderboard from '../Leaderboard'
import { useConnect, useAccount, useDisconnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { motion, AnimatePresence, sync } from 'framer-motion'
import GameLoader from '../GameLoader'

export function Demo() {
  const [showGame, setShowGame] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [showNFTs, setShowNFTs] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const { actions } = useMiniAppContext();
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'nfts' | 'stats' | 'leaderboard'>('home')
  const [showRewardPopup, setShowRewardPopup] = useState(false)
  const [showTransactionPopup, setShowTransactionPopup] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'confirmed' | 'error'>('idle')
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  
  const { connect, connectors } = useConnect()
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()
  
  // Initialize wagmi with a delay to prevent errors and multiple connection attempts
  useEffect(() => {
    // Set initializing to true for 3.5 seconds
    setInitializing(true)
    
    // Try connecting multiple times during initialization to ensure proper connection
    const connectAttempts = [100, 800, 1500]; // Connection attempt times in milliseconds
    const connectTimers: NodeJS.Timeout[] = [];
    
    // Create multiple connect attempts at different intervals
    if (connectors && connectors[0]) {
      connectAttempts.forEach(delay => {
        const timer = setTimeout(() => {
          console.log(`Connection attempt at ${delay}ms`);
          try {
            connect({ connector: connectors[0] });
          } catch (err) {
            console.log('Connection attempt failed:', err);
          }
        }, delay);
        connectTimers.push(timer);
      });
    }
    
    // Final timeout to end initialization period
    const finalTimer = setTimeout(() => {
      setInitializing(false);
    }, 2000); // 3.5 seconds delay
    
    // Clean up all timers
    return () => {
      connectTimers.forEach(timer => clearTimeout(timer));
      clearTimeout(finalTimer);
    }
  }, [connect, connectors])
  
  // Blockchain transaction hooks
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })
  
  // Get NFT supply from blockchain
  const { formattedCurrentSupply, formattedMaxSupply, currentSupply, maxSupply, isLoading: isLoadingSupply, hasError } = useNFTSupply()

  // Check if user has seen the welcome popup before
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenWelcomePopup = localStorage.getItem('hasSeenWelcomeGiftBoxPopup1')
      if (!hasSeenWelcomePopup) {
        // Show popup after a short delay for better UX
        const timer = setTimeout(() => {
          setShowRewardPopup(true)
        }, 1500)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const handleCloseRewardPopup = () => {
    setShowRewardPopup(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenWelcomeGiftBoxPopup1', 'true')
    }
  }

  useEffect(()=>{
    if(isConnected){
      actions?.addFrame()
    }
  },[isConnected])

  // Handle transaction status updates
  useEffect(() => {
    if (isPending) {
      setTransactionStatus('pending')
      setShowTransactionPopup(true)
    } else if (isConfirming) {
      setTransactionStatus('pending')
    } else if (isConfirmed) {
      setTransactionStatus('confirmed')
      setTransactionHash(hash || null)
      // Auto-close popup after 2 seconds and start game
      setTimeout(() => {
        setShowTransactionPopup(false)
        setShowGame(true)
        setTransactionStatus('idle')
      }, 2000)
    } else if (error) {
      setTransactionStatus('error')
      setShowTransactionPopup(true)
    }
  }, [isPending, isConfirming, isConfirmed, error, hash])

  // Start game with blockchain transaction
  const handleStartGame = async () => {
    // No need for connection check here anymore since the buttons are hidden when not connected
    // But keep it as a safety check just in case
    if (!isConnected) {
      connect({ connector: connectors[0] })
      return
    }

    try {
      // Reset any previous error state
      setTransactionStatus('idle')
      setTransactionHash(null)
      
      const { CONTRACT_ADDRESSES, TOKEN_REWARD_ABI } = await import('@/lib/contracts')
      
      writeContract({
        address: CONTRACT_ADDRESSES.TOKEN_REWARD as `0x${string}`,
        abi: TOKEN_REWARD_ABI,
        functionName: 'startGame',
        args: []
      })
    } catch (err) {
      console.error('Failed to start game transaction:', err)
      setTransactionStatus('error')
      setShowTransactionPopup(true)
      
      // Log detailed error for debugging
      if (err instanceof Error) {
        console.error('Transaction error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        })
      }
    }
  }

  // Sync activeTab with current view
  useEffect(() => {
    if (showNFTs) {
      setActiveTab('nfts')
    } else if (showStats) {
      setActiveTab('stats')
    } else if (showLeaderboard) {
      setActiveTab('leaderboard')
    } else {
      setActiveTab('home')
    }
  }, [showNFTs, showStats, showLeaderboard])

  if (showGame) {
    return (
      <GameLoader onBack={() => {
        setShowGame(false)
        setActiveTab('home')
      }} />
    )
  }

  if (showNFTs) {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Enhanced NFT Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-indigo-500/10" />
        <div className="relative z-10 px-4 pt-6 pb-4">
          <motion.div 
            className="text-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              <FontAwesomeIcon icon={faGem} className="mr-3 text-purple-500" />
              NFT Collection
            </h1>
            <p className="text-white/70">Your digital collectibles and achievements</p>
          </motion.div>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center px-4 pb-24 pt-8">
        <motion.div 
          className="w-full max-w-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 backdrop-blur-2xl" 
            style={{
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1), rgba(59, 130, 246, 0.1))',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Simplified particles */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute w-2 h-2 bg-purple-400/60 rounded-full" style={{ left: '20%', top: '20%' }} />
              <div className="absolute w-1 h-1 bg-cyan-400/60 rounded-full" style={{ left: '70%', top: '30%' }} />
              <div className="absolute w-2 h-2 bg-green-400/60 rounded-full" style={{ left: '50%', top: '70%' }} />
            </div>
            
            <div className="relative z-10 p-12 text-center">
              <div className="text-8xl mb-6">
                🎨
              </div>
              
              <h2 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                NFT Gallery Coming Soon
              </h2>
              
              <p className="text-white/70 text-lg mb-8 leading-relaxed">
                Experience the future of gaming collectibles. Your unique NFTs and achievements will be displayed here in a beautiful, interactive gallery.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
                  <div className="text-3xl mb-3">🎮</div>
                  <div className="font-bold text-white mb-2">Play to Earn</div>
                  <div className="text-white/60 text-sm">Every game you play brings you closer to exclusive NFT rewards</div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
                  <div className="text-3xl mb-3">🏆</div>
                  <div className="font-bold text-white mb-2">Achievement Badges</div>
                  <div className="text-white/60 text-sm">Unlock rare collectibles by reaching new milestones</div>
                </div>
              </div>
              
              {isConnected && (
                <motion.button
                  onClick={handleStartGame}
                  disabled={isPending || isConfirming || initializing}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                  whileHover={{ scale: isPending || isConfirming || initializing ? 1 : 1.05, y: isPending || isConfirming || initializing ? 0 : -2 }}
                  whileTap={{ scale: isPending || isConfirming || initializing ? 1 : 0.95 }}
                >
                  {initializing ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Connecting...
                    </>
                  ) : isPending || isConfirming ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      {isPending ? 'Confirming...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPlay} className="mr-2" />
                      Start Playing Now
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} onShowGame={setShowGame} onShowNFTs={setShowNFTs} onShowStats={setShowStats} onShowLeaderboard={setShowLeaderboard} />
    </div>
  )
  }

  if (showStats) {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Enhanced Stats Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
        
      </div>
      
      <div className="px-4 pb-24 -mt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <UserStats />
        </motion.div>
      </div>
      <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} onShowGame={setShowGame} onShowNFTs={setShowNFTs} onShowStats={setShowStats} onShowLeaderboard={setShowLeaderboard} />
    </div>
  )
  }

  if (showLeaderboard) {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Enhanced Leaderboard Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10" />
       
      </div>
      
      <div className="px-4 pb-24 -mt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Leaderboard />
        </motion.div>
      </div>
      <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} onShowGame={setShowGame} onShowNFTs={setShowNFTs} onShowStats={setShowStats} onShowLeaderboard={setShowLeaderboard} />
    </div>
  )
  }

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Header Section */}
      <div className="relative">
        {/* Simplified Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-cyan-400/10 to-purple-500/08 rounded-full blur-2xl" />
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-purple-600/10 to-green-400/08 rounded-full blur-2xl" />
        </div>

        {/* Header Content */}
        <div className="relative z-10 px-4 pt-8 pb-6">
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center mb-4">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img 
                  src="/images/icon.jpg" 
                  alt="ChainCrush" 
                  className="w-20 h-20 rounded-2xl shadow-2xl border-4 border-white/20"
                />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faCrown} className="text-white text-xs" />
                </div>
              </motion.div>
            </div>
            <motion.h1 
              className="text-4xl font-black mb-2 holographic-text"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Chain Crush 
            </motion.h1>
           
          </motion.div>

          {isConnected && (
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.8, type: "spring" }}
            >
              <motion.button
                onClick={handleStartGame}
                disabled={isPending || isConfirming || initializing}
                className="relative group overflow-hidden gaming-gradient text-white font-black py-6 px-12 rounded-3xl text-xl shadow-lg border border-cyan-500/20 backdrop-blur-sm disabled:opacity-70 disabled:cursor-not-allowed"
                whileHover={{ 
                  scale: isPending || isConfirming || initializing ? 1 : 1.03,
                  boxShadow: isPending || isConfirming || initializing ? "0 8px 25px -5px rgba(0, 255, 255, 0.25), 0 0 15px rgba(147, 51, 234, 0.15)" : "0 10px 30px -5px rgba(0, 255, 255, 0.3), 0 0 25px rgba(147, 51, 234, 0.2)"
                }}
                whileTap={{ scale: isPending || isConfirming || initializing ? 1 : 0.97 }}
                style={{ 
                  boxShadow: '0 8px 25px -5px rgba(0, 255, 255, 0.25), 0 0 15px rgba(147, 51, 234, 0.15)'
                }}
              >
                {/* Static background */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 via-purple-500/30 to-green-400/30" />
                
                {/* Content */}
                <div className="relative z-10 flex items-center justify-center space-x-4">
                  {initializing ? (
                    <>
                      <motion.div
                        className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span>Connecting...</span>
                    </>
                  ) : isPending || isConfirming ? (
                    <>
                      <motion.div
                        className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span>{isPending ? 'Confirming...' : 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faGamepad} className="text-2xl" />
                      <span>Launch Game</span>
                      <FontAwesomeIcon icon={faRocket} className="text-xl" />
                    </>
                  )}
                </div>
                
                {/* Subtle shine effect */}
                <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-20" />
              </motion.button>
            </motion.div>
          )}

          {/* Wallet Connection */}
          {!isConnected && (
            <motion.div 
              className="mb-8 max-w-sm mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <motion.button
                type="button"
                onClick={() => connect({ connector: connectors[0] })}
                className="w-full gaming-gradient text-white font-bold py-4 px-8 rounded-2xl shadow-lg border border-cyan-500/20 backdrop-blur-sm transition-all duration-300"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  boxShadow: '0 8px 25px -5px rgba(0, 255, 255, 0.3), 0 0 20px rgba(147, 51, 234, 0.2)'
                }}
              >
                <div className="flex items-center justify-center space-x-3">
                  <FontAwesomeIcon icon={faBolt} className="text-cyan-300" />
                  <span className="font-black tracking-wider">CONNECT WALLET</span>
                  <FontAwesomeIcon icon={faArrowRight} className="text-sm text-purple-300" />
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* Stats Dashboard */}
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <StatsCard 
              icon={faUsers} 
              title="Active Players" 
              value="3.5K" 
              trend="+23%" 
              color="from-cyan-400 via-blue-500 to-purple-600"
            />
            <StatsCard 
              icon={faCoins} 
              title="Rewards Pool" 
              value="100 ARB" 
              trend="LIVE" 
              color="from-purple-500 via-cyan-400 to-green-400"
            />
            <StatsCard 
              icon={faFire} 
              title="Games Today" 
              value="5K" 
              trend="+12%" 
              color="from-pink-500 via-purple-500 to-cyan-400"
            />
            <StatsCard 
              icon={faGem} 
              title={`NFTs Minted`}
              value={isLoadingSupply ? "..." : formattedCurrentSupply} 
              trend={hasError ? "Demo" : "Live"} 
              color="from-green-400 via-cyan-400 to-purple-500"
            />
          </motion.div>

          {/* Main CTA Button */}
         
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 px-4 pb-24">
        <motion.div 
          className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <FeatureCard
            icon={faPlay}
            title="Play & Earn"
            description="Match Memes, complete levels, and earn real rewards with every game"
            gradient="from-green-400 to-emerald-600"
            delay={0}
          />
          <FeatureCard
            icon={faGem}
            title="Collect NFTs"
            description="Mint unique digital collectibles and trade them in our marketplace"
            gradient="from-purple-400 to-indigo-600"
            delay={0.2}
          />
          <FeatureCard
            icon={faTrophy}
            title="Compete"
            description="Climb the leaderboards and compete for massive weekly prize pools"
            gradient="from-yellow-400 to-orange-600"
            delay={0.4}
          />
        </motion.div>
      </div>
      
      {/* Welcome Gift Box Popup for First-Time Users */}
      <AnimatePresence>
        {showRewardPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(20,20,40,0.8))',
              backdropFilter: 'blur(15px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3000,
            }}
            onClick={handleCloseRewardPopup}
          >
            {/* Animated background elements */}
            <div style={{
              position: 'absolute',
              top: '10%',
              left: '5%',
              width: '100px',
              height: '100px',
              background: 'radial-gradient(circle, rgba(0,255,255,0.2) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'float 8s ease-in-out infinite',
            }} />
            
            <div style={{
              position: 'absolute',
              top: '20%',
              right: '10%',
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(147,51,234,0.2) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'float 6s ease-in-out infinite reverse',
            }} />
            
            <div style={{
              position: 'absolute',
              bottom: '15%',
              left: '15%',
              width: '60px',
              height: '60px',
              background: 'radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'float 10s ease-in-out infinite',
            }} />

            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                width: 'min(95vw, 520px)',
                maxHeight: '90vh',
                borderRadius: '28px',
                border: '2px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(25px)',
                background: 'linear-gradient(135deg, rgba(0,255,255,0.1), rgba(147,51,234,0.08), rgba(34,197,94,0.05))',
                boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Animated gift box icon */}
              {/* <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", damping: 15 }}
                style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '120px',
                  height: '120px',
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,165,0,0.2))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  filter: 'blur(1px)',
                  zIndex: -1
                }}
              >
                🎁
              </motion.div> */}

              {/* Close Button */}
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
                onClick={handleCloseRewardPopup}
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '20px',
                  zIndex: 1000,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}
                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.2)' }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>

              {/* Scrollable Content Container */}
              <div 
                className="popup-scroll"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  padding: '40px 32px',
                  position: 'relative',
                  zIndex: 2,
                  // Custom scrollbar styling
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(0,255,255,0.3) rgba(255,255,255,0.1)',
                  // Smooth scrolling
                  scrollBehavior: 'smooth'
                }}
              >
                {/* Content */}
                <div style={{ 
                  textAlign: 'center', 
                  color: '#fff',
                  position: 'relative'
                }}>
                {/* Welcome Title */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 style={{ 
                    fontSize: '32px', 
                    fontWeight: '900', 
                    marginBottom: '8px',
                    background: 'linear-gradient(135deg, #00ffff, #9333ea, #22c55e)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 30px rgba(0,255,255,0.5)',
                    letterSpacing: '-0.5px'
                  }}>
                    🎮 Welcome to ChainCrush!
                  </h1>
                  <p style={{ 
                    fontSize: '18px', 
                    opacity: 0.9, 
                    marginBottom: '30px',
                    fontWeight: '500'
                  }}>
                    The Ultimate Web3 Candy Crush Experience
                  </p>
                </motion.div>

                {/* Gift Box Feature Highlight */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.1))', 
                    borderRadius: '20px', 
                    padding: '25px',
                    marginBottom: '25px',
                    border: '1px solid rgba(255,215,0,0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Shimmer effect */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    animation: 'shimmer 3s infinite'
                  }} />
                  
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎁</div>
                    <h2 style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      marginBottom: '15px',
                      color: '#ffd700'
                    }}>
                      Daily Gift Box Rewards!
                    </h2>
                    <p style={{ 
                      fontSize: '16px', 
                      opacity: 0.95, 
                      lineHeight: '1.6',
                      marginBottom: '20px'
                    }}>
                      Play games and earn amazing rewards every day!
                    </p>
                  </div>
                </motion.div>

                {/* Reward Details */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  style={{ 
                    background: 'rgba(255,255,255,0.08)', 
                    borderRadius: '18px', 
                    padding: '20px',
                    marginBottom: '25px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    marginBottom: '15px',
                    color: '#00ffff'
                  }}>
                    🎯 How It Works
                  </h3>
                  
                  <div style={{ textAlign: 'left', fontSize: '14px', lineHeight: '1.6' }}>
                    <div style={{ 
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span style={{ 
                        background: 'linear-gradient(135deg, #00ffff, #22c55e)',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>1</span>
                      <span><strong>Play & Complete Games</strong> - Finish any game to unlock your gift box</span>
                    </div>
                    
                    <div style={{ 
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span style={{ 
                        background: 'linear-gradient(135deg, #9333ea, #22c55e)',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>2</span>
                      <span><strong>Open Gift Box</strong> - Tap to reveal your daily rewards</span>
                    </div>
                    
                    <div style={{ 
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span style={{ 
                        background: 'linear-gradient(135deg, #ffd700, #ff6b35)',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>3</span>
                      <span><strong>Claim Tokens</strong> - Get ARB, PEPE, BOOP, or try again!</span>
                    </div>
                    
                    <div style={{ 
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span style={{ 
                        background: 'linear-gradient(135deg, #ff6b35, #9333ea)',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>4</span>
                      <span><strong>Share & Earn More</strong> - Share on Farcaster for bonus claims!</span>
                    </div>
                  </div>
                </motion.div>

                {/* Daily Limits */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  style={{ 
                    background: 'rgba(34,197,94,0.1)', 
                    borderRadius: '16px', 
                    padding: '18px',
                    marginBottom: '25px',
                    border: '1px solid rgba(34,197,94,0.3)'
                  }}
                >
                  <h4 style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    marginBottom: '10px',
                    color: '#22c55e'
                  }}>
                    ⏰ Daily Limits
                  </h4>
                  <div style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>
                    <div style={{ marginBottom: '6px' }}>
                      <strong>🎁 Gift Box:</strong> 5 claims per 12-hour period
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <strong>📤 Share Rewards:</strong> +2 bonus claims (6-hour cooldown)
                    </div>
                    <div>
                      <strong>🔄 Reset:</strong> Every 12 hours at 5:30 AM IST
                    </div>
                  </div>
                </motion.div>
                
                {/* CTA Button */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  onClick={handleCloseRewardPopup}
                  style={{
                    background: 'linear-gradient(135deg, #00ffff 0%, #9333ea 50%, #22c55e 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '16px 40px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(0,255,255,0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: '0 12px 35px rgba(0,255,255,0.4)'
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Button shine effect */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'shimmer 2s infinite'
                  }} />
                  
                  <span style={{ position: 'relative', zIndex: 2 }}>
                    🚀 Start Earning Rewards Now!
                  </span>
                </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Popup */}
      {showTransactionPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(20,20,40,0.5))',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={() => {
            if (transactionStatus === 'error') {
              setShowTransactionPopup(false)
              setTransactionStatus('idle')
            }
          }}
        >
          {/* Animated background elements */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '60px',
            height: '60px',
            background: 'radial-gradient(circle, rgba(0,255,255,0.3) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite',
            zIndex: 1
          }} />
          
          <div style={{
            position: 'absolute',
            top: '60%',
            right: '15%',
            width: '80px',
            height: '80px',
            background: 'radial-gradient(circle, rgba(147,51,234,0.3) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite reverse',
            zIndex: 1
          }} />
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: 'min(95vw, 480px)',
              maxHeight: '90vh',
              borderRadius: '24px',
              padding: '32px',
              border: '2px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              background: transactionStatus === 'pending'
                ? 'linear-gradient(135deg, rgba(0,255,255,0.15), rgba(147,51,234,0.1))'
                : transactionStatus === 'confirmed'
                ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))'
                : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(248,113,113,0.1))',
              boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
              animation: 'slideInScale 0.4s ease-out',
              zIndex: 2
            }}
          >
            {/* Close Button - only show on error */}
            {transactionStatus === 'error' && (
              <button
                onClick={() => {
                  setShowTransactionPopup(false)
                  setTransactionStatus('idle')
                }}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  borderRadius: '12px',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                ✕
              </button>
            )}

            {/* Content */}
            <div style={{ textAlign: 'center', color: '#fff', position: 'relative', zIndex: 3 }}>
              {/* Status Icon */}
              <div style={{ 
                fontSize: '64px', 
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {transactionStatus === 'pending' && (
                  <motion.div
                    style={{ 
                      display: 'inline-block',
                      filter: 'drop-shadow(0 0 20px rgba(0,255,255,0.5))'
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    ⚡
                  </motion.div>
                )}
                {transactionStatus === 'confirmed' && (
                  <div style={{ filter: 'drop-shadow(0 0 20px rgba(34,197,94,0.5))' }}>
                    ✅
                  </div>
                )}
                {transactionStatus === 'error' && (
                  <div style={{ filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.5))' }}>
                    ❌
                  </div>
                )}
              </div>

              {/* Status Text */}
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                marginBottom: '16px',
                // background: transactionStatus === 'pending'
                //   ? 'linear-gradient(135deg, #00ffff, #9333ea)'
                //   : transactionStatus === 'confirmed'
                //   ? 'linear-gradient(135deg, #22c55e, #10b981)'
                //   : 'linear-gradient(135deg, #ef4444, #f87171)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color:'#ffffff',
                // WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(255,255,255,0.3)'
              }}>
                {transactionStatus === 'pending' && 'Transaction in Progress'}
                {transactionStatus === 'confirmed' && 'Transaction Confirmed!'}
                {transactionStatus === 'error' && 'Transaction Failed'}
              </h2>

              {/* Status Description */}
              <p style={{ 
                fontSize: '16px', 
                opacity: 0.9, 
                marginBottom: '24px', 
                lineHeight: '1.6',
                maxWidth: '400px',
                margin: '0 auto 24px auto'
              }}>
                {transactionStatus === 'pending' && 'Please wait while we process your game start transaction on the blockchain...'}
                {transactionStatus === 'confirmed' && 'Your game session has been registered! Starting the game now...'}
                {transactionStatus === 'error' && 'Something went wrong. Please try again or check your wallet connection.'}
              </p>

              {/* Transaction Hash */}
              {transactionHash && (
                <div style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  borderRadius: '16px', 
                  padding: '20px',
                  marginBottom: '24px',
                  fontSize: '13px',
                  wordBreak: 'break-all',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ 
                    marginBottom: '8px', 
                    fontWeight: 'bold',
                    color: '#00ffff',
                    fontSize: '14px'
                  }}>
                    Transaction Hash:
                  </div>
                  <div style={{ 
                    opacity: 0.8,
                    fontFamily: 'monospace',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {transactionHash}
                  </div>
                </div>
              )}

              {/* Error Details */}
              {transactionStatus === 'error' && error && (
                <div style={{ 
                  background: 'rgba(239,68,68,0.1)', 
                  borderRadius: '16px', 
                  padding: '20px',
                  marginBottom: '24px',
                  fontSize: '14px',
                  border: '1px solid rgba(239,68,68,0.3)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '12px',
                    color: '#ef4444',
                    fontSize: '16px'
                  }}>
                    Error Details:
                  </div>
                  
                  {/* User-friendly error message */}
                  <div style={{ 
                    opacity: 0.9, 
                    wordBreak: 'break-word',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(239,68,68,0.2)',
                    marginBottom: '12px'
                  }}>
                    {(() => {
                      const errorMessage = error && typeof error === 'object' && 'message' in error ? error.message : 'Unknown error occurred';
                      
                      // Handle common error types with user-friendly messages
                      if (errorMessage.includes('User rejected the request') || errorMessage.includes('user rejected')) {
                        return '❌ Transaction was cancelled by user. Please try again when ready.';
                      } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance')) {
                        return '💰 Insufficient funds for gas fees. Please add more ETH to your wallet.';
                      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
                        return '🌐 Network error. Please check your internet connection and try again.';
                      } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
                        return '⏰ Transaction timed out. Please try again.';
                      } else if (errorMessage.includes('nonce') || errorMessage.includes('Nonce')) {
                        return '🔄 Transaction nonce error. Please try again.';
                      } else if (errorMessage.includes('gas') || errorMessage.includes('Gas')) {
                        return '⛽ Gas estimation failed. Please try again or increase gas limit.';
                      } else if (errorMessage.includes('revert') || errorMessage.includes('execution reverted')) {
                        return '🚫 Transaction was rejected by the smart contract.';
                      } else if (errorMessage.includes('connector.getChainId is not a function') || 
                                 errorMessage.includes('connector.getChainId') ||
                                 errorMessage.includes('getChainId is not a function')) {
                        // Disconnect wallet first, then refresh page for connector errors
                        // disconnect();
                        setTimeout(() => {
                          window.location.reload();
                        }, 1000);
                        return '🔄 Wallet connector error detected. Disconnecting and refreshing page...';
                      } else if (errorMessage.includes('denied') || errorMessage.includes('denied transaction')) {
                        return '🚫 Transaction was denied. Please try again.';
                      } else if (errorMessage.includes('already known') || errorMessage.includes('already pending')) {
                        return '⏳ Transaction is already pending. Please wait for confirmation.';
                      } else if (errorMessage.includes('underpriced') || errorMessage.includes('gas price too low')) {
                        return '⛽ Gas price too low. Please try again.';
                      } else if (errorMessage.includes('replacement transaction underpriced')) {
                        return '⛽ Replacement transaction gas price too low. Please try again.';
                      } else if (errorMessage.includes('max fee per gas less than block base fee')) {
                        return '⛽ Gas fee too low for current network conditions. Please try again.';
                      } else if (errorMessage.includes('transaction underpriced')) {
                        return '⛽ Transaction gas price too low. Please try again.';
                      } else if (errorMessage.includes('intrinsic gas too low')) {
                        return '⛽ Gas limit too low. Please try again.';
                      } else if (errorMessage.includes('out of gas')) {
                        return '⛽ Transaction ran out of gas. Please try again with higher gas limit.';
                      } else if (errorMessage.includes('bad instruction')) {
                        return '🚫 Invalid transaction data. Please try again.';
                      } else if (errorMessage.includes('bad jump destination')) {
                        return '🚫 Invalid transaction execution. Please try again.';
                      } else if (errorMessage.includes('stack overflow')) {
                        return '🚫 Transaction execution error. Please try again.';
                      } else if (errorMessage.includes('stack underflow')) {
                        return '🚫 Transaction execution error. Please try again.';
                      } else if (errorMessage.includes('invalid opcode')) {
                        return '🚫 Invalid transaction operation. Please try again.';
                      } else if (errorMessage.includes('call depth limit exceeded')) {
                        return '🚫 Transaction call depth exceeded. Please try again.';
                      } else if (errorMessage.includes('contract creation code storage out of gas')) {
                        return '⛽ Contract creation out of gas. Please try again.';
                      } else if (errorMessage.includes('precompiled contract failed')) {
                        return '🚫 Contract execution failed. Please try again.';
                      } else if (errorMessage.includes('invalid account')) {
                        return '🚫 Invalid account. Please check your wallet connection.';
                      } else if (errorMessage.includes('invalid signature')) {
                        return '🚫 Invalid signature. Please try again.';
                      } else if (errorMessage.includes('invalid nonce')) {
                        return '🔄 Invalid transaction nonce. Please try again.';
                      } else if (errorMessage.includes('invalid gas limit')) {
                        return '⛽ Invalid gas limit. Please try again.';
                      } else if (errorMessage.includes('invalid gas price')) {
                        return '⛽ Invalid gas price. Please try again.';
                      } else if (errorMessage.includes('invalid value')) {
                        return '💰 Invalid transaction value. Please try again.';
                      } else if (errorMessage.includes('invalid chain id')) {
                        return '🔗 Invalid network. Please switch to the correct network.';
                      } else if (errorMessage.includes('unsupported chain')) {
                        return '🔗 Unsupported network. Please switch to a supported network.';
                      } else if (errorMessage.includes('wallet not connected') || errorMessage.includes('not connected')) {
                        return '🔌 Wallet not connected. Please connect your wallet and try again.';
                      } else if (errorMessage.includes('wallet locked') || errorMessage.includes('locked')) {
                        return '🔒 Wallet is locked. Please unlock your wallet and try again.';
                      } else if (errorMessage.includes('wallet disconnected') || errorMessage.includes('disconnected')) {
                        return '🔌 Wallet disconnected. Please reconnect your wallet and try again.';
                      } else if (errorMessage.includes('provider not found') || errorMessage.includes('no provider')) {
                        return '🔌 No wallet provider found. Please install a wallet and try again.';
                      } else if (errorMessage.includes('user denied') || errorMessage.includes('user cancelled')) {
                        return '❌ Transaction was cancelled by user. Please try again when ready.';
                      } else if (errorMessage.includes('transaction failed') || errorMessage.includes('failed')) {
                        return '❌ Transaction failed. Please try again.';
                      } else if (errorMessage.includes('unknown error') || errorMessage.includes('Unknown error')) {
                        return '⚠️ Something went wrong. Please try again.';
                      } else {
                        // For any other error, show a generic message
                        return '⚠️ Something went wrong. Please try again.';
                      }
                    })()}
                  </div>

                  {/* Technical details (collapsible) */}
                  <details style={{ marginTop: '12px' }}>
                    <summary style={{ 
                      cursor: 'pointer', 
                      color: '#f87171', 
                      fontSize: '13px',
                      fontWeight: 'bold',
                      marginBottom: '8px'
                    }}>
                      🔧 Show Technical Details
                    </summary>
                    <div style={{ 
                      fontSize: '12px', 
                      opacity: 0.7,
                      background: 'rgba(0,0,0,0.3)',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(239,68,68,0.2)',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      maxHeight: '150px',
                      overflowY: 'auto'
                    }}>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Error:</strong> {error && typeof error === 'object' && 'message' in error ? error.message : String(error)}
                      </div>
                      {error && typeof error === 'object' && 'cause' in error && error.cause && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Cause:</strong> {String(error.cause).split('.')[0]}
                        </div>
                      )}
                      {'code' in error && (error as any).code && (
                        <div>
                          <strong>Code:</strong> {String((error as any).code)}
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Action Button */}
              {transactionStatus === 'error' && (
                <div style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  justifyContent: 'center',
                  marginTop: '8px'
                }}>
                  <motion.button
                    onClick={() => {
                      setShowTransactionPopup(false)
                      setTransactionStatus('idle')
                      setTransactionHash(null)
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '16px',
                      padding: '14px 28px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)'
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setShowTransactionPopup(false)
                      setTransactionStatus('idle')
                      setTransactionHash(null)
                      // Retry the transaction
                      setTimeout(() => {
                        handleStartGame()
                      }, 100)
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #00ffff 0%, #9333ea 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '14px 28px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(0,255,255,0.3)'
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Try Again
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
      
      <BottomNavbar
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onShowGame={setShowGame} 
        onShowNFTs={setShowNFTs} 
        onShowStats={setShowStats} 
        onShowLeaderboard={setShowLeaderboard} 
      />
    </div>
  )
}

interface BottomNavbarProps {
  activeTab: 'home' | 'nfts' | 'stats' | 'leaderboard'
  onTabChange: (tab: 'home' | 'nfts' | 'stats' | 'leaderboard') => void
  onShowGame: (show: boolean) => void
  onShowNFTs: (show: boolean) => void
  onShowStats: (show: boolean) => void
  onShowLeaderboard: (show: boolean) => void
}

// Stats Card Component
const StatsCard = ({ icon, title, value, trend, color }: {
  icon: any;
  title: string;
  value: string;
  trend: string;
  color: string;
}) => (
  <motion.div
    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-4 text-white shadow-xl border border-white/20 backdrop-blur-sm`}
    whileHover={{ scale: 1.02, y: -2 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-2">
        <FontAwesomeIcon icon={icon} className="text-xl opacity-90" />
        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
          {value === "..." ? (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          ) : (
            trend
          )}
        </span>
      </div>
      <div className="text-2xl font-black mb-1">
        {value === "..." ? (
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-white/20 rounded animate-pulse"></div>
            <div className="w-4 h-6 bg-white/20 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          </div>
        ) : (
          value
        )}
      </div>
      <div className="text-sm opacity-80 font-medium">{title}</div>
    </div>
    <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
  </motion.div>
);

// Feature Card Component
const FeatureCard = ({ icon, title, description, gradient, delay }: {
  icon: any;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}) => (
  <motion.div
    className="relative group"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.4 + delay, duration: 0.6 }}
  >
    <div className="relative overflow-hidden rounded-3xl border border-white/10 backdrop-blur-2xl p-8 mt-5 h-full" 
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} mb-6 shadow-lg`}>
        <FontAwesomeIcon icon={icon} className="text-2xl text-white" />
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-white/70 leading-relaxed">{description}</p>
      
      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  </motion.div>
);

function BottomNavbar({ activeTab, onTabChange, onShowGame, onShowNFTs, onShowStats, onShowLeaderboard }: BottomNavbarProps) {
  const { isConnected } = useAccount(); // Add wallet connection check for bottom navbar
  const handleTabClick = (tab: 'home' | 'nfts' | 'stats' | 'leaderboard') => {
    onTabChange(tab)
    
    switch (tab) {
      case 'nfts':
        onShowGame(false)
        onShowNFTs(true)
        onShowStats(false)
        onShowLeaderboard(false)
        break
      case 'stats':
        onShowGame(false)
        onShowNFTs(false)
        onShowStats(true)
        onShowLeaderboard(false)
        break
      case 'leaderboard':
        onShowGame(false)
        onShowNFTs(false)
        onShowStats(false)
        onShowLeaderboard(true)
        break
      case 'home':
      default:
        onShowGame(false)
        onShowNFTs(false)
        onShowStats(false)
        onShowLeaderboard(false)
        break
    }
  }

  // Show different tabs based on wallet connection status
  const tabs = [
    { id: 'home', icon: faHome, label: 'Home', color: 'from-cyan-400 to-blue-500' },
    // { id: 'nfts', icon: faGem, label: 'NFTs', color: 'from-purple-500 to-pink-500' },
    { id: 'stats', icon: faChartBar, label: 'Analytics', color: 'from-green-400 to-cyan-400' },
    { id: 'leaderboard', icon: faTrophy, label: 'Champions', color: 'from-purple-600 to-cyan-500' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      {/* Central Play Button - Only shown when wallet is connected
      {isConnected && (
        <motion.button
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full gaming-gradient flex items-center justify-center shadow-xl border-2 border-white/20"
          onClick={() => onShowGame(true)}
          initial={{ scale: 0.8, opacity: 0, y: 0 }}
          animate={{ scale: 1, opacity: 1, y: -20 }}
          whileHover={{ scale: 1.1, boxShadow: '0 0 25px rgba(0, 255, 255, 0.4)' }}
          whileTap={{ scale: 0.95 }}
          style={{
            boxShadow: '0 10px 25px -5px rgba(0, 255, 255, 0.3), 0 0 15px rgba(147, 51, 234, 0.2)'
          }}
        >
          <FontAwesomeIcon icon={faGamepad} className="text-xl text-white" />
        </motion.button>
      )} */}

      <div 
        className="relative overflow-hidden rounded-3xl border backdrop-blur-2xl shadow-2xl mx-auto max-w-md glass-card neon-glow"
        style={{
          background: 'var(--glass-background)',
          borderColor: 'var(--glass-border)',
          boxShadow: '0 8px 25px -5px rgba(0, 255, 255, 0.2), 0 0 20px rgba(147, 51, 234, 0.15), 0 15px 35px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Enhanced background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/08 via-purple-500/08 to-green-400/08 blur-xl" />
        
        <div className="relative z-10 flex justify-around items-center py-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabClick(tab.id as any)}
                className="relative flex flex-col items-center justify-center px-5 py-2 rounded-2xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                }}
              >
                {/* Active indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${tab.color}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 0.2, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
                
                {/* Icon */}
                <motion.div
                  animate={{
                    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                    scale: isActive ? 1.1 : 1
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <FontAwesomeIcon 
                    icon={tab.icon} 
                    className="text-lg mb-1 relative z-10" 
                  />
                </motion.div>
                
                {/* Label */}
                <motion.div 
                  className="text-xs font-medium relative z-10"
                  animate={{
                    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                    fontWeight: isActive ? 600 : 500
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.label}
                </motion.div>
                
                {/* Active dot indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className={`absolute -top-1 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${tab.color}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  )
}
