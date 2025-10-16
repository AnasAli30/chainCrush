'use client'

import { useState } from 'react'
import { useConnect, useAccount, useDisconnect } from 'wagmi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWallet, faCheck, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons'

interface WaitlistFormProps {
  onWalletConnected?: () => void
}

export default function WaitlistForm({ onWalletConnected }: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const { connect, connectors, isPending } = useConnect()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const handleWalletConnect = async () => {
    try {
      // Try to connect with the first available connector
      if (connectors[0]) {
        await connect({ connector: connectors[0] })
        onWalletConnected?.()
      }
    } catch (err) {
      console.error('Wallet connection failed:', err)
      setError('Failed to connect wallet. Please try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !address) return

    setIsSubmitting(true)
    setError('')

    try {
      // Submit to waitlist API
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          walletAddress: address,
        }),
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        throw new Error('Failed to submit to waitlist')
      }
    } catch (err) {
      console.error('Waitlist submission failed:', err)
      setError('Failed to submit to waitlist. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
          <FontAwesomeIcon icon={faCheck} className="text-white text-2xl" />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Welcome to the Waitlist!</h3>
          <p className="text-gray-300">
            You're all set! We'll notify you when the game launches.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-2xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <FontAwesomeIcon icon={faWallet} className="text-white text-xl" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Join the Waitlist</h2>
        <p className="text-gray-300 text-sm">
          Connect your wallet and join our exclusive waitlist to be the first to play!
        </p>
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          <button
            onClick={handleWalletConnect}
            disabled={isPending}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isPending ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faWallet} />
            )}
            <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
          </button>
          
          <p className="text-xs text-gray-400 text-center">
            Connect your wallet to continue with the waitlist
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder="Enter your email address"
            />
          </div>

          <div className="bg-slate-700 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Connected Wallet:</p>
            <p className="text-sm text-white font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
            <button
              type="button"
              onClick={() => disconnect()}
              className="text-xs text-red-400 hover:text-red-300 mt-1 flex items-center space-x-1"
            >
              <FontAwesomeIcon icon={faTimes} />
              <span>Disconnect</span>
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faCheck} />
            )}
            <span>{isSubmitting ? 'Submitting...' : 'Join Waitlist'}</span>
          </button>
        </form>
      )}
    </div>
  )
}