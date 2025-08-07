'use client'

import { useState } from 'react'
import { FarcasterActions } from '@/components/Home/FarcasterActions'
import { User } from '@/components/Home/User'
import { WalletActions } from '@/components/Home/WalletActions'
import { NotificationActions } from './NotificationActions'
import CandyCrushGame from './CandyCrushGame'
import NFTManager from '../NFTManager'
import UserStats from '../UserStats'

export function Demo() {
  const [showGame, setShowGame] = useState(false)
  const [showNFTs, setShowNFTs] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'game' | 'nfts' | 'stats'>('home')

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
        <div className="p-4">
          <NFTManager />
        </div>
        <BottomNavbar activeTab="nfts" onTabChange={setActiveTab} onShowGame={setShowGame} onShowNFTs={setShowNFTs} onShowStats={setShowStats} />
      </div>
    )
  }

  if (showStats) {
    return (
      <div className="min-h-screen pb-20">
        <div className="p-4">
          <UserStats />
        </div>
        <BottomNavbar activeTab="stats" onTabChange={setActiveTab} onShowGame={setShowGame} onShowNFTs={setShowNFTs} onShowStats={setShowStats} />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
        <div className="w-full max-w-4xl space-y-6">
          {/* Welcome Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-pink-600">🍭 ChainCrush</h1>
            <p className="text-lg text-gray-600">The Sweetest Candy Crush Game on Farcaster!</p>
          </div>

          {/* Main Content Area */}
          <div className="text-center space-y-6">
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold text-pink-600 mb-4">Welcome to ChainCrush!</h2>
              <p className="text-gray-700 mb-6">
                Play the most addictive candy-matching game on the blockchain. 
                Earn NFTs, climb leaderboards, and compete with friends!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl mb-2">🎮</div>
                  <div className="font-semibold">Play & Earn</div>
                  <div className="text-gray-600">Match candies and earn rewards</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl mb-2">🎴</div>
                  <div className="font-semibold">Collect NFTs</div>
                  <div className="text-gray-600">Mint unique ChainCrush NFTs</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl mb-2">🏆</div>
                  <div className="font-semibold">Compete</div>
                  <div className="text-gray-600">Climb the leaderboards</div>
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
      />
    </div>
  )
}

interface BottomNavbarProps {
  activeTab: 'home' | 'game' | 'nfts' | 'stats'
  onTabChange: (tab: 'home' | 'game' | 'nfts' | 'stats') => void
  onShowGame: (show: boolean) => void
  onShowNFTs: (show: boolean) => void
  onShowStats: (show: boolean) => void
}

function BottomNavbar({ activeTab, onTabChange, onShowGame, onShowNFTs, onShowStats }: BottomNavbarProps) {
  const handleTabClick = (tab: 'home' | 'game' | 'nfts' | 'stats') => {
    onTabChange(tab)
    
    switch (tab) {
      case 'game':
        onShowGame(true)
        break
      case 'nfts':
        onShowNFTs(true)
        break
      case 'stats':
        onShowStats(true)
        break
      case 'home':
      default:
        // Stay on home
        break
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around items-center h-16 px-4">
        <button
          onClick={() => handleTabClick('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 ${
            activeTab === 'home' 
              ? 'text-pink-600' 
              : 'text-gray-500 hover:text-pink-500'
          }`}
        >
          <div className="text-xl mb-1">🏠</div>
          <div className="text-xs font-medium">Home</div>
        </button>

        <button
          onClick={() => handleTabClick('game')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 ${
            activeTab === 'game' 
              ? 'text-pink-600' 
              : 'text-gray-500 hover:text-pink-500'
          }`}
        >
          <div className="text-xl mb-1">🎮</div>
          <div className="text-xs font-medium">Play</div>
        </button>

        <button
          onClick={() => handleTabClick('nfts')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 ${
            activeTab === 'nfts' 
              ? 'text-pink-600' 
              : 'text-gray-500 hover:text-pink-500'
          }`}
        >
          <div className="text-xl mb-1">🎴</div>
          <div className="text-xs font-medium">NFTs</div>
        </button>

        <button
          onClick={() => handleTabClick('stats')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 ${
            activeTab === 'stats' 
              ? 'text-pink-600' 
              : 'text-gray-500 hover:text-pink-500'
          }`}
        >
          <div className="text-xl mb-1">📊</div>
          <div className="text-xs font-medium">Stats</div>
        </button>
      </div>
    </div>
  )
}
