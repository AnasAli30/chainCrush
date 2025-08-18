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
import { useConnect, useAccount } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import GameLoader from '../GameLoader'

export function Demo() {
  const [showGame, setShowGame] = useState(false)
  const [showNFTs, setShowNFTs] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const { actions } = useMiniAppContext();
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'nfts' | 'stats' | 'leaderboard'>('home')
  const [showRewardPopup, setShowRewardPopup] = useState(false)
  
  const { connect, connectors } = useConnect()
  const { isConnected } = useAccount()
  
  // Get NFT supply from blockchain
  const { formattedCurrentSupply, formattedMaxSupply, currentSupply, maxSupply, isLoading: isLoadingSupply, hasError } = useNFTSupply()

  // Check if user has seen the reward popup before
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenRewardPopup = localStorage.getItem('hasSeenRewardnewPopup')
      if (!hasSeenRewardPopup) {
        // Show popup after a short delay for better UX
        const timer = setTimeout(() => {
          setShowRewardPopup(true)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const handleCloseRewardPopup = () => {
    setShowRewardPopup(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenRewardnewPopup', 'true')
    }
  }

  useEffect(()=>{
    if(isConnected){
      actions?.addFrame()
    }
  },[isConnected])

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
              
              <motion.button
                onClick={() => {
                  incrementGamesPlayed();
                  setShowGame(true);
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <FontAwesomeIcon icon={faPlay} className="mr-2" />
                Start Playing Now
              </motion.button>
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

          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.8, type: "spring" }}
          >
            <motion.button
              onClick={() => {
                incrementGamesPlayed();
                setShowGame(true);
              }}
              className="relative group overflow-hidden gaming-gradient text-white font-black py-6 px-12 rounded-3xl text-xl shadow-lg border border-cyan-500/20 backdrop-blur-sm"
              whileHover={{ 
                scale: 1.03,
                boxShadow: "0 10px 30px -5px rgba(0, 255, 255, 0.3), 0 0 25px rgba(147, 51, 234, 0.2)"
              }}
              whileTap={{ scale: 0.97 }}
              style={{ 
                boxShadow: '0 8px 25px -5px rgba(0, 255, 255, 0.25), 0 0 15px rgba(147, 51, 234, 0.15)'
              }}
            >
              {/* Static background */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 via-purple-500/30 to-green-400/30" />
              
              {/* Content */}
              <div className="relative z-10 flex items-center justify-center space-x-4">
                <FontAwesomeIcon icon={faGamepad} className="text-2xl" />
                <span>Launch Game</span>
                <FontAwesomeIcon icon={faRocket} className="text-xl" />
              </div>
              
              {/* Subtle shine effect */}
              <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-20" />
            </motion.button>
          </motion.div>

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
              value="2.5K" 
              trend="+23%" 
              color="from-cyan-400 via-blue-500 to-purple-600"
            />
            <StatsCard 
              icon={faCoins} 
              title="Rewards Pool" 
              value="1.6M BOOP" 
              trend="LIVE" 
              color="from-purple-500 via-cyan-400 to-green-400"
            />
            <StatsCard 
              icon={faFire} 
              title="Games Today" 
              value="4.5K" 
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
      
      {/* Reward Popup for First-Time Users */}
      {showRewardPopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
          }}
          onClick={handleCloseRewardPopup}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(90vw, 500px)',
              borderRadius: '20px',
              padding: '30px',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(20px)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1))',
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)'
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseRewardPopup}
              style={{
                position: 'absolute',
                top: 15,
                right: 15,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: '50%',
                width: 35,
                height: 35,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ✕
            </button>

            {/* Content */}
            <div style={{ textAlign: 'center', color: '#fff',display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
              {/* <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏆</div> */}
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '15px' }}>
                Welcome to ChainCrush!
              </h2>
              <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '5px', lineHeight: '1.5' }}>
                Get ready for the sweetest rewards! Play daily 
              </p>
              <img src="/candy/1.png" alt="" style={{width:"50px",height:"50px"}} />
              <p style={{fontSize:"16px",opacity:0.9,marginBottom:"5px",lineHeight:"1.5"}}> compete for $BOOP coins.</p>
              {/* Reward Info */}
              <div style={{ 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '15px', 
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
                  🎁 Top 10 Players Get Rewards
                </h3>
                  <div style={{ textAlign: 'left', fontSize: '13px', lineHeight: '1.4' }}>
                  <div style={{ marginBottom: '6px' ,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <strong>🥇 1st Place (20%)</strong>
                    <span style={{ opacity: 0.9 }}>310,360 $BOOP</span>
                  </div>
                  <div style={{ marginBottom: '6px' ,display:"flex",alignItems:"center",justifyContent:"space-between"}}>                    <strong>🥈 2nd Place (18%)</strong>
                    <span style={{ opacity: 0.9 }}>279,324 $BOOP</span>
                  </div>
                  <div style={{ marginBottom: '6px' ,display:"flex",alignItems:"center",justifyContent:"space-between"}}>                    <strong>🥉 3rd Place (15%)</strong>
                    <span style={{ opacity: 0.9 }}>232,770 $BOOP</span>
                  </div>
                  <div style={{ marginBottom: '6px' ,display:"flex",alignItems:"center",justifyContent:"space-between"}}>                    <strong>4th–6th Place</strong>
                    <span style={{ opacity: 0.9 }}>139,662 $BOOP each</span>
                  </div>
                  <div style={{ marginBottom: '6px' ,display:"flex",alignItems:"center",justifyContent:"space-between"}}>                    <strong>7th–8th Place</strong>
                    <span style={{ opacity: 0.9 }}>93,108 $BOOP each</span>
                  </div>
                  <div style={{ marginBottom: '6px' ,display:"flex",alignItems:"center",justifyContent:"space-between"}}>                   
                    <strong>9th–10th Place</strong>
                    <span style={{ opacity: 0.9 }}>62,072 $BOOP each</span>
                  </div>
                </div>
              </div>
              
              <motion.button
                onClick={handleCloseRewardPopup}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Let's Start Playing! 🎮
              </motion.button>
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

  const tabs = [
    { id: 'home', icon: faHome, label: 'Home', color: 'from-cyan-400 to-blue-500' },
    // { id: 'nfts', icon: faGem, label: 'NFTs', color: 'from-purple-500 to-pink-500' },
    { id: 'stats', icon: faChartBar, label: 'Analytics', color: 'from-green-400 to-cyan-400' },
    { id: 'leaderboard', icon: faTrophy, label: 'Champions', color: 'from-purple-600 to-cyan-500' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
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
