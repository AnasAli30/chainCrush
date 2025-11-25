'use client'

import { useEffect, useState, useRef } from 'react'
import Pusher from 'pusher-js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrophy, faCoins, faUser } from '@fortawesome/free-solid-svg-icons'

interface Notification {
  id: string
  type: 'win'
  username: string
  address: string
  pfpUrl?: string
  score: number
  amount: number
  token: string
  animationType: 'right-left' | 'left-right' | 'top-bottom' | 'bottom-top'
}

const TOKEN_DECIMALS: Record<string, number> = {
  'USDC': 6,
  'arb': 18,
  'pepe': 18,
  'boop': 18,
  'crsh': 18
}

const TOKEN_NAMES: Record<string, string> = {
  'arb': 'ARB',
  'pepe': 'PEPE',
  'boop': 'BOOP',
  'crsh': 'CRSH'
}

export default function WinNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const pusherRef = useRef<Pusher | null>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    // Initialize Pusher
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2'

    if (!pusherKey) {
      console.error('Pusher key not found in environment variables')
      return
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      enabledTransports: ['ws', 'wss']
    })

    pusherRef.current = pusher

    // Subscribe to channel
    const channel = pusher.subscribe('Monad-spin')
    channelRef.current = channel

    // Listen for win events
    channel.bind('win', (data: {
      username?: string
      address: string
      pfpUrl?: string
      score: number
      amount: number
      token: string
    }) => {
      console.log('Win notification received:', data)
      
      // Only show if user actually won a token (not "none")
      if (data.token && data.token !== 'none' && data.amount > 0) {
        const animationTypes: Array<'right-left' | 'left-right' | 'top-bottom' | 'bottom-top'> = [
          'right-left',
          'left-right',
          'top-bottom',
          'bottom-top'
        ]
        const randomAnimation = animationTypes[Math.floor(Math.random() * animationTypes.length)]

        const notification: Notification = {
          id: `${Date.now()}-${Math.random()}`,
          type: 'win',
          username: data.username || truncateAddress(data.address),
          address: data.address,
          pfpUrl: data.pfpUrl,
          score: data.score || 0,
          amount: data.amount,
          token: data.token,
          animationType: randomAnimation
        }

        setNotifications(prev => [...prev, notification])

        // Auto-remove notification after 8 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id))
        }, 8000)
      }
    })

    // Handle connection errors
    pusher.connection.bind('error', (err: any) => {
      console.error('Pusher connection error:', err)
    })

    pusher.connection.bind('connected', () => {
      console.log('Pusher connected')
    })

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all()
        channelRef.current.unsubscribe()
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect()
      }
    }
  }, [])

  const truncateAddress = (address: string): string => {
    if (!address) return 'Anonymous'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatAmount = (amount: number, token: string): string => {
    // Amount is already in the correct format (e.g., 0.18 for ARB, 13416 for PEPE)
    // Just format it nicely based on the value
    if (amount >= 1000) {
      return amount.toLocaleString('en-US', { maximumFractionDigits: 0 })
    } else if (amount >= 1) {
      return amount.toLocaleString('en-US', { maximumFractionDigits: 2 })
    } else {
      return amount.toLocaleString('en-US', { maximumFractionDigits: 6 })
    }
  }

  const getAnimationClass = (animationType: string): string => {
    switch (animationType) {
      case 'right-left':
        return 'animate-slide-right-left'
      case 'left-right':
        return 'animate-slide-left-right'
      case 'top-bottom':
        return 'animate-slide-top-bottom'
      case 'bottom-top':
        return 'animate-slide-bottom-top'
      default:
        return 'animate-slide-right-left'
    }
  }

  // Don't render anything if there are no notifications
  if (notifications.length === 0) {
    return null
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100000] pointer-events-none"
      style={{ height: '25px' }}
    >
      <style jsx>{`
        @keyframes slide-right-left {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(-100%);
            opacity: 0;
          }
        }

        @keyframes slide-left-right {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes slide-top-bottom {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }

        @keyframes slide-bottom-top {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
        }

        .animate-slide-right-left {
          animation: slide-right-left 8s ease-in-out forwards;
        }

        .animate-slide-left-right {
          animation: slide-left-right 8s ease-in-out forwards;
        }

        .animate-slide-top-bottom {
          animation: slide-top-bottom 8s ease-in-out forwards;
        }

        .animate-slide-bottom-top {
          animation: slide-bottom-top 8s ease-in-out forwards;
        }
      `}</style>

      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`absolute w-full h-full flex items-center justify-center ${getAnimationClass(notification.animationType)}`}
          style={{
            background: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
            height: '25px',
            willChange: 'transform, opacity'
          }}
        >
          <div className="flex items-center gap-2 text-white text-xs font-semibold px-4">
            {notification.pfpUrl ? (
              <img
                src={notification.pfpUrl}
                alt={notification.username}
                className="w-4 h-4 rounded-full border border-white/30"
              />
            ) : (
              <FontAwesomeIcon icon={faUser} className="w-3 h-3" />
            )}
            <span className="font-bold">{notification.username}</span>
            <span className="opacity-90">scored</span>
            <span className="font-bold">{notification.score.toLocaleString()}</span>
            <span className="opacity-90">and won</span>
            <FontAwesomeIcon icon={faTrophy} className="w-3 h-3 text-yellow-300" />
            <span className="font-bold">{formatAmount(notification.amount, notification.token)}</span>
            <span className="font-bold uppercase">{TOKEN_NAMES[notification.token.toLowerCase()] || notification.token}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

