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
          <h1 className="text-3xl font-bold text-center">Loading...</h1>
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
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
</svg>

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
