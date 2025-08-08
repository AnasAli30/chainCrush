'use client'

import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faImages, faChartBar, faTrophy } from '@fortawesome/free-solid-svg-icons'
import { FarcasterActions } from '@/components/Home/FarcasterActions'
import { User } from '@/components/Home/User'
import { WalletActions } from '@/components/Home/WalletActions'
import { NotificationActions } from './NotificationActions'
import { ThemeToggle } from '@/components/ThemeToggle'
import CandyCrushGame from './CandyCrushGame'
import NFTManager from '../NFTManager'
import UserStats from '../UserStats'
import Leaderboard from '../Leaderboard'
import { useConnect, useAccount } from 'wagmi'
import { motion } from 'framer-motion'

export function Demo() {
  const [showGame, setShowGame] = useState(false)
  const [showNFTs, setShowNFTs] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'nfts' | 'stats' | 'leaderboard'>('home')
  
  const { connect, connectors } = useConnect()
  const { isConnected } = useAccount()

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
              <h1 className="text-4xl font-bold text-pink-600">🎴 NFTs</h1>
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
                style={{ color: 'rgb(var(--text-primary))' }}
              >
                Welcome to
                <h1 className="text-4xl font-bold text-white  text-transparent"> ChainCrush!</h1>
              </h2>
              <p 
                className="text-lg mb-8 leading-relaxed"
                style={{ color: 'rgb(var(--text-secondary))' ,width:"120%",marginLeft:"-10%"}}
              >
                Play the most addictive candy-matching game on the blockchain. 
                Earn NFTs, climb leaderboards, and compete with friends!
              </p>
              
              {/* Play Game Button */}
              <button
                onClick={() => setShowGame(true)}
                className="relative overflow-hidden group font-bold py-6 px-9 rounded-2xl text-xl transition-all duration-500 transform hover:scale-105 shadow-2xl mb-6"
                style={{
                  background: 'var(--gradient-primary)',
                  boxShadow: '0 20px 40px -12px rgba(99, 102, 241, 0.4)'
                }}
              >
                <span className="relative z-10 text-white">🎮 Start Playing Now!</span>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'var(--gradient-secondary)'
                  }}
                />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl mb-2">🎮</div>
                  <div className="font-semibold text-[#19adff]">Play & Earn</div>
                  <div className="text-[#28374d]">Match candies and earn rewards</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl mb-2">🎴</div>
                  <div className="font-semibold text-[#19adff]">Collect NFTs</div>
                  <div className="text-[#28374d]">Mint unique ChainCrush NFTs</div>
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
