import { useState, useEffect, useRef } from 'react'
import LoadingSpinner from './LoadingSpinner'
import dynamic from 'next/dynamic'

const CandyCrushGame = dynamic(() => import('./Home/CandyCrushGame'), {
  ssr: false
})

interface GameLoaderProps {
  onBack: () => void
}

export default function GameLoader({ onBack }: GameLoaderProps) {
  const [isGameReady, setIsGameReady] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const gameReadyRef = useRef(false)

  useEffect(() => {
    // Create a realistic loading progression
    const loadGame = async () => {
      try {
        // Step 1: Import the game component (20% progress)
        setLoadingProgress(20)
        const GameModule = await import('./Home/CandyCrushGame')
        
        // Step 2: Load Phaser library if not already loaded (40% progress)
        await new Promise(resolve => setTimeout(resolve, 300))
        setLoadingProgress(40)
        
        // Step 3: Preload game assets (60% progress)
        await new Promise(resolve => setTimeout(resolve, 400))
        setLoadingProgress(60)
        
        // Step 4: Initialize game engine (80% progress)
        await new Promise(resolve => setTimeout(resolve, 400))
        setLoadingProgress(80)
        
        // Step 5: Final setup and transition (100% progress)
        await new Promise(resolve => setTimeout(resolve, 300))
        setLoadingProgress(100)
        
        // Small delay after 100% for smooth transition
        await new Promise(resolve => setTimeout(resolve, 400))
        
        if (!gameReadyRef.current) {
          gameReadyRef.current = true
          setIsGameReady(true)
        }
      } catch (error) {
        console.error('Failed to load game:', error)
        // Fallback - still try to show the game after minimum load time
        await new Promise(resolve => setTimeout(resolve, 1000))
        if (!gameReadyRef.current) {
          gameReadyRef.current = true
          setIsGameReady(true)
        }
      }
    }

    loadGame()
  }, [])

  // Listen for game initialization from the actual game component
  useEffect(() => {
    const handleGameInitialized = () => {
      if (!gameReadyRef.current) {
        console.log('Game initialized event received')
        gameReadyRef.current = true
        setLoadingProgress(100)
        // Small delay for smooth transition
        setTimeout(() => {
          setIsGameReady(true)
        }, 300)
      }
    }

    // Listen for custom game ready events
    window.addEventListener('gameInitialized', handleGameInitialized)
    window.addEventListener('phaserGameReady', handleGameInitialized)
    
    return () => {
      window.removeEventListener('gameInitialized', handleGameInitialized)
      window.removeEventListener('phaserGameReady', handleGameInitialized)
    }
  }, [])

  // Show loading screen until game is ready
  if (!isGameReady) {
    return <LoadingSpinner progress={loadingProgress} />
  }

  // Show the game once it's ready
  return <CandyCrushGame onBack={onBack} />
}
