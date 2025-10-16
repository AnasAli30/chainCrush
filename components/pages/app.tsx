'use client'

import { Demo } from '@/components/Home'
import Website from '@/components/Website'
import { useFrame } from '@/components/farcaster-provider'
import { SafeAreaContainer } from '@/components/safe-area-container'
import { WalletProvider } from '@/components/wallet-provider'
import { useMemo } from 'react'

export default function Home() {
  const { context, isLoading, isSDKLoaded } = useFrame()

  if (isLoading) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
          <div className="relative">
            {/* Centered icon with scaling animation */}
            <div className="w-32 h-32 flex items-center justify-center">
              <img 
                src="/images/icon.jpg" 
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
    return <Website />
  }

  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      <WalletProvider>
        <Demo />
      </WalletProvider>
    </SafeAreaContainer>
  )
}
