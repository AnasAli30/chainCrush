'use client'

import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faImages, faChartBar, faTrophy } from '@fortawesome/free-solid-svg-icons'
import { useMiniAppContext } from '@/hooks/use-miniapp-context';

import { FarcasterActions } from '@/components/Home/FarcasterActions'
import { User } from '@/components/Home/User'
import { WalletActions } from '@/components/Home/WalletActions'
import { NotificationActions } from './NotificationActions'
import { ThemeToggle } from '@/components/ThemeToggle'
import NFTManager from '../NFTManager'
import UserStats from '../UserStats'
import Leaderboard from '../Leaderboard'
import { useConnect, useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import LoadingSpinner from '../LoadingSpinner'

const CandyCrushGame = dynamic(() => import('./CandyCrushGame'), {
  ssr: false,
  loading: () => <LoadingSpinner />
})

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

  // Check if user has seen the reward popup before
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenRewardPopup = localStorage.getItem('hasSeenRewardPopup')
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
      localStorage.setItem('hasSeenRewardPopup', 'true')
    }
  }

  useEffect(()=>{
    if(isConnected){
      actions?.addFrame()
    }
  },[isConnected])

  if (showGame) {
    return (
      <CandyCrushGame onBack={() => {
        setShowGame(false)
        setActiveTab('home')
      }} />
    )
  }

  if (showNFTs) {
    return (
      <div className="min-h-screen pb-20">
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
          <div className="w-full max-w-4xl space-y-6">
            <div className="text-center space-y-4">
             
              <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-8 rounded-2xl shadow-lg">
                <div className="text-6xl mb-4">🚧</div>
                <h2 className="text-2xl font-bold text-pink-600 mb-4">Coming Soon!</h2>
                <p className="text-gray-700 mb-6">
                  The NFT collection feature is under development. 
                  Soon you'll be able to view and manage your ChainCrush NFTs here!
                </p>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl mb-2">🎮</div>
                  <div className="font-semibold">Keep Playing!</div>
                  <div className="text-gray-600">Continue playing to earn NFTs that will be available here soon</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <BottomNavbar activeTab="nfts" onTabChange={setActiveTab} onShowGame={setShowGame} onShowNFTs={setShowNFTs} onShowStats={setShowStats} onShowLeaderboard={setShowLeaderboard} />
      </div>
    )
  }

  if (showStats) {
    return (
      <div className="min-h-screen pb-20">
        <div className="p-4">
          <UserStats />
        </div>
        <BottomNavbar activeTab="stats" onTabChange={setActiveTab} onShowGame={setShowGame} onShowNFTs={setShowNFTs} onShowStats={setShowStats} onShowLeaderboard={setShowLeaderboard} />
      </div>
    )
  }

  if (showLeaderboard) {
    return (
      <div className="min-h-screen pb-20">
        <div className="p-4">
          <Leaderboard />
        </div>
        <BottomNavbar activeTab="leaderboard" onTabChange={setActiveTab} onShowGame={setShowGame} onShowNFTs={setShowNFTs} onShowStats={setShowStats} onShowLeaderboard={setShowLeaderboard} />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      {/* <ThemeToggle /> */}
      <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
        <div className="w-full max-w-4xl space-y-6">
          {/* Welcome Header */}
          {/* <div className="text-center space-y-6">
            <div className="space-y-4">
              <h1 
                className="text-4xl font-bold text-white  text-transparent"
              >
                ChainCrush
              </h1>
              <p 
                className="text-xl font-medium"
                style={{ color: 'rgb(var(--text-secondary))' }}
              >
                The Sweetest Candy Crush Game on Farcaster!
              </p>
            </div>
          </div> */}

          {/* Wallet Connection Button */}
          {!isConnected && (
            <div className="mb-3 w-full max-w-sm mx-auto">
              <motion.button
                type="button"
                onClick={() => connect({ connector: connectors[0] })}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FontAwesomeIcon icon={faHome} className="w-4 h-4 mr-2" />
                Connect Wallet
              </motion.button>
            </div>
          )}

          {/* Main Content Area */}
          <div className="text-center space-y-6">
            <div 
              className="p-8 rounded-3xl backdrop-blur-xl border"
              style={{
                background: 'var(--glass-background)',
                borderColor: 'var(--glass-border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <h2 
                className="text-3xl font-bold mb-6"
                style={{ color: 'rgb(var(--text-primary))', display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column" }}
              >
                WelCome To
              <img src="/images/icon.png" alt=""  style={{borderRadius:"50%",height:"220px",width:"220px"}} /> 
              </h2>
             
              {/* Play Game Button */}
              <motion.button
                onClick={() => setShowGame(true)}
                className="relative overflow-hidden font-bold py-6 px-9 rounded-2xl text-xl shadow-2xl mb-6"
                style={{
                  boxShadow: '0 20px 40px -12px rgba(99, 102, 241, 0.4)'
                }}
                animate={{
                  scale: [1, 1.05, 1, 1.05, 1]
                }}
                transition={{
                  scale: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
                whileHover={{ 
                  scale: 1.15,
                  boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.6)'
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div 
                  className="absolute inset-0"
                  animate={{
                    background: [
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    ]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                <span className="relative z-10 text-white font-bold text-xl">
                  🎮 Start Playing Now!
                </span>
                
                <motion.div 
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #48dbfb 100%)'
                  }}
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl mb-2">🎮</div>
                  <div className="font-semibold text-[#19adff]">Play & Earn</div>
                  <div className="text-[#28374d]">Match candies and earn rewards</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl mb-2">🎴</div>
                  <div className="font-semibold text-[#19adff]">Collect & Burn NFTs</div>
                  <div className="text-[#28374d]">Mint unique NFTs & burn rare ones for rewards</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl mb-2">🏆</div>
                  <div className="font-semibold text-[#19adff]">Compete</div>
                  <div className="text-[#28374d]">Climb the leaderboards</div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
              <img src="/candy/2.png" alt="" style={{width:"50px",height:"50px"}} />
              <p style={{fontSize:"16px",opacity:0.9,marginBottom:"5px",lineHeight:"1.5"}}> compete for PEPE coins.</p>
              {/* Reward Info */}
              <div style={{ 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '15px', 
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
                  🎁 Weekly Rewards
                </h3>
                <div style={{ textAlign: 'left', fontSize: '14px' }}>
                  <div style={{ marginBottom: '8px' }}>🥇 1st Place: 2,000,000 PEPE</div>
                  <div style={{ marginBottom: '8px' }}>🥈 2nd Place: 1,500,000 PEPE</div>
                  <div style={{ marginBottom: '8px' }}>🥉 3rd Place: 1,000,000 PEPE</div>
                  <div style={{ marginBottom: '8px' }}>🏅 4th-6th: 500,000 PEPE each</div>
                  <div style={{ marginBottom: '8px' }}>🎖️ 7th-8th: 250,000 PEPE each</div>
                  <div>🏆 9th-10th: 100,000 PEPE each</div>
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
        activeTab="home" 
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

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 border-t backdrop-blur-xl z-50"
      style={{
        backgroundColor: `var(--glass-background)`,
        borderColor: `var(--glass-border)`,
        boxShadow: '0 -10px 30px -10px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="flex justify-around items-center h-16 px-4">
        <button
          onClick={() => handleTabClick('home')}
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200"
          style={{
            color: activeTab === 'home' 
              ? 'rgb(var(--primary-color))' 
              : 'rgb(var(--text-secondary))'
          }}
        >
          <FontAwesomeIcon icon={faHome} className="text-xl mb-1" />
          <div className="text-xs font-medium">Home</div>
        </button>



        <button
          onClick={() => handleTabClick('nfts')}
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200"
          style={{
            color: activeTab === 'nfts' 
              ? 'rgb(var(--primary-color))' 
              : 'rgb(var(--text-secondary))'
          }}
        >
          <FontAwesomeIcon icon={faImages} className="text-xl mb-1" />
          <div className="text-xs font-medium">NFTs</div>
        </button>

        <button
          onClick={() => handleTabClick('stats')}
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200"
          style={{
            color: activeTab === 'stats' 
              ? 'rgb(var(--primary-color))' 
              : 'rgb(var(--text-secondary))'
          }}
        >
          <FontAwesomeIcon icon={faChartBar} className="text-xl mb-1" />
          <div className="text-xs font-medium">Stats</div>
        </button>

        <button
          onClick={() => handleTabClick('leaderboard')}
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200"
          style={{
            color: activeTab === 'leaderboard' 
              ? 'rgb(var(--primary-color))' 
              : 'rgb(var(--text-secondary))'
          }}
        >
          <FontAwesomeIcon icon={faTrophy} className="text-xl mb-1" />
          <div className="text-xs font-medium">Leaderboard</div>
        </button>
      </div>
    </div>
  )
}
