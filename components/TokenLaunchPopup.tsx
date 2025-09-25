'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faCoins, faRocket, faClock, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { useMiniAppContext } from '@/hooks/use-miniapp-context'

interface TokenLaunchPopupProps {
  isOpen: boolean
  onClose: () => void
  clankerUrl: string
}

export default function TokenLaunchPopup({ isOpen, onClose, clankerUrl }: TokenLaunchPopupProps) {
  const { actions } = useMiniAppContext()
  
  // Handle button actions
  const handleTradeClick = () => {
    actions?.openUrl(clankerUrl)
    onClose()
  }
  
  const handleViewOnFarcaster = () => {
    // Format for Arbitrum ERC20 token: eip155:42161/erc20:0xe461003e78a7bf4f14f0d30b3ac490701980ab07
    const tokenFormat = "eip155:42161/erc20:0xe461003e78a7bf4f14f0d30b3ac490701980ab07"
    actions?.viewToken({ token: tokenFormat })
    onClose()
  }
  
  const handleLearnMoreClick = () => {
    actions?.openUrl("https://chaincrush.fun")
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Popup */}
          <motion.div
            className="relative z-10 w-full max-w-md bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl"
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300 
            }}
          >
            {/* Close button */}
            <button 
              className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
              onClick={onClose}
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
            
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10 p-8">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
                <FontAwesomeIcon icon={faCoins} className="text-3xl text-white" />
              </div>
              
              {/* Title */}
              <h3 className="text-3xl font-bold text-center text-white mb-2">
                Chain Crush Token is Live!
              </h3>
              
              {/* Description */}
              <p className="text-center text-white/80 mb-8">
                Our token is now live and ready for trading. Check it out!
              </p>
              
              {/* Buttons */}
              <div className="space-y-3">
                {/* View Token on Farcaster - New Button at Top */}
                <button
                  onClick={handleViewOnFarcaster}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-white hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} />
                  <span>View Token on Farcaster</span>
                </button>
                
                <button
                  onClick={handleTradeClick}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl font-bold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faRocket} />
                  <span>Trade On Clanker</span>
                </button>
                
                <button
                  onClick={handleLearnMoreClick}
                  className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-xl font-bold text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faCoins} />
                  <span>Learn More</span>
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 bg-transparent text-white/70 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faClock} />
                  <span>Maybe Later</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function FloatingTokenIcon({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      className="fixed bottom-24 right-6 z-50 w-14 h-14 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 border-2 border-white/20"
      whileHover={{ scale: 1.1, rotate: 10 }}
      whileTap={{ scale: 0.9 }}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.5 }}
      onClick={onClick}
    >
      <FontAwesomeIcon icon={faCoins} className="text-2xl text-white" />
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
    </motion.button>
  )
}
