'use client'

import { Demo } from '@/components/Home'
import { useFrame } from '@/components/farcaster-provider'
import { SafeAreaContainer } from '@/components/safe-area-container'
import { WagmiProvider } from 'wagmi'
import { config } from '@/components/wallet-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMemo } from 'react'

export default function Home() {
  const { context, isLoading, isSDKLoaded } = useFrame()
  const queryClient = useMemo(() => new QueryClient(), [])

  if (isLoading) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
          <div className="relative">
            {/* Centered icon with scaling animation */}
            <div className="w-32 h-32 flex items-center justify-center">
              <img 
                src="/images/icon.png" 
                alt="Chain Crush" 
                className="w-24 h-24 rounded-[20px] animate-[iconScale_2s_ease-in-out_infinite]"
              />
            </div>
          </div>
        
        </div>
      </SafeAreaContainer>
    )
  }

  if (!isSDKLoaded) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-6 ">
          <div className="max-w-md w-full text-center space-y-8">
           

            {/* Main Message */}
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-white-100">
                ChainCrush Mini App
              </h1>
              
            </div>

            {/* CTA Button */}
            <div className="space-y-4">
              <button 
                onClick={() => {
                  window.open('https://farcaster.xyz/~/mini-apps/launch?domain=chain-crush-black.vercel.app', '_blank')
                }}
                className="w-full bg-gradient-to-r from-[#19adff] to-[#667eea] hover:from-[#1590d4] hover:to-[#5a67d8] text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3"
              >
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 256 256" fill="none" style={{display: 'inline-block', verticalAlign: 'middle'}}><rect width="256" height="256" rx="56" fill="#7C65C1"></rect><path d="M183.296 71.68H211.968L207.872 94.208H200.704V180.224L201.02 180.232C204.266 180.396 206.848 183.081 206.848 186.368V191.488L207.164 191.496C210.41 191.66 212.992 194.345 212.992 197.632V202.752H155.648V197.632C155.648 194.345 158.229 191.66 161.476 191.496L161.792 191.488V186.368C161.792 183.081 164.373 180.396 167.62 180.232L167.936 180.224V138.24C167.936 116.184 150.056 98.304 128 98.304C105.944 98.304 88.0638 116.184 88.0638 138.24V180.224L88.3798 180.232C91.6262 180.396 94.2078 183.081 94.2078 186.368V191.488L94.5238 191.496C97.7702 191.66 100.352 194.345 100.352 197.632V202.752H43.0078V197.632C43.0078 194.345 45.5894 191.66 48.8358 191.496L49.1518 191.488V186.368C49.1518 183.081 51.7334 180.396 54.9798 180.232L55.2958 180.224V94.208H48.1278L44.0318 71.68H72.7038V54.272H183.296V71.68Z" fill="white"></path></svg>

                <span>Open in Farcaster</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
              
              {/* Alternative text */}
              <p className="text-white-500 text-xs">
                Don't have Farcaster? 
                <a 
                  href="https://www.farcaster.xyz/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:underline ml-1 font-medium"
                >
                  Get it here
                </a>
              </p>
            </div>

            {/* Features Preview */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">What's inside:</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🎮</span>
                  <span className="text-gray-600">Chain Crush Game</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🎨</span>
                  <span className="text-gray-600">NFT Minting</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🏆</span>
                  <span className="text-gray-600">Leaderboards</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">💰</span>
                  <span className="text-gray-600">PEPE Rewards</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SafeAreaContainer>
    )
  }

  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <Demo />
        </QueryClientProvider>
      </WagmiProvider>
    </SafeAreaContainer>
  )
}
