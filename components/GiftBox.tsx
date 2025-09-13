'use client'

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faCoins, faTimes, faCheck, faStar } from '@fortawesome/free-solid-svg-icons';
import { useAccount } from 'wagmi';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { authenticatedFetch } from '@/lib/auth';
import { useContractWrite, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, TOKEN_REWARD_ABI } from '@/lib/contracts';
import { APP_URL } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

interface GiftBoxProps {
  onClose: () => void;
  onClaimComplete: () => void;
}

interface GiftBoxReward {
  tokenType: 'arb' | 'pepe' | 'boop' | 'none';
  amount: number;
  amountInWei?: string;
  signature?: string;
  claimsToday: number;
  remainingClaims: number;
}

export default function GiftBox({ onClose, onClaimComplete }: GiftBoxProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState<GiftBoxReward | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [boxAnimation, setBoxAnimation] = useState<'idle' | 'shaking' | 'opening' | 'opened'>('idle');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  
  const { address } = useAccount();
  const { context, actions } = useMiniAppContext();
  
  // Blockchain transaction for claiming tokens
  const { writeContract: writeClaimToken, data: claimTx, isSuccess: claimSuccess, isError: claimError, error: claimErrorObj } = useContractWrite();
  const { isLoading: isClaimLoading, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({ hash: claimTx });

  // Share winning reward on Farcaster
  const shareWinning = async (reward: GiftBoxReward) => {
    if (!actions) {
      console.error('Farcaster actions not available');
      return;
    }

    try {
      const username = context?.user?.username || 'Anonymous Player';
      const tokenInfo = getTokenInfo(reward.tokenType);
      
      let shareMessage = '';
      
      if (reward.tokenType === 'none') {
        shareMessage = `Just opened a Chain Crush gift box! 🎁\n\nBetter luck next time... but I'm not giving up! 💪\n\nCome play and test your luck! 🎮`;
      } else {
        shareMessage = `Just WON ${reward.amount.toLocaleString()} ${tokenInfo.name} tokens from a Chain Crush gift box! 🎁💰\n\n🔥 This game is FIRE! Who else is ready to claim some rewards? 👀\n\nCome play and get your bag! 💎`;
      }


      await actions.composeCast({
        text: shareMessage,
        embeds: [APP_URL || "https://chain-crush-black.vercel.app/"]
      });
      
      console.log('Successfully shared winning on Farcaster!');
    } catch (error) {
      console.error('Failed to share winning:', error);
    }
  };

  const openGiftBox = async () => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsOpening(true);
    setError(null);
    
    // Start shaking animation
    setBoxAnimation('shaking');
    
    // Generate particles for opening effect
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5
    }));
    setParticles(newParticles);

    // After shaking, start opening animation
    setTimeout(() => {
      setBoxAnimation('opening');
    }, 1000);

    try {
      const response = await authenticatedFetch('/api/claim-gift-box', {
        method: 'POST',
        body: JSON.stringify({
          userAddress: address,
          fid: context?.user?.fid
        })
      });

      const result = await response.json();

      if (result.success) {
        setReward(result);
        
        // Complete opening animation
        setTimeout(() => {
          setBoxAnimation('opened');
          setShowReward(true);
        }, 1500);
      } else {
        setError(result.error || 'Failed to claim gift box');
        setBoxAnimation('idle');
      }
    } catch (error) {
      console.error('Error claiming gift box:', error);
      setError('Failed to claim gift box');
      setBoxAnimation('idle');
    } finally {
      setIsOpening(false);
    }
  };

  const claimToken = async () => {
    if (!reward || reward.tokenType === 'none' || !reward.signature) {
      // For "Better Luck Next Time" rewards, share on Farcaster before completing
      if (reward && reward.tokenType === 'none') {
        // Store the claim in localStorage even for "none" rewards
        storeGiftBoxClaim(reward);
        await shareWinning(reward);
      }
      onClaimComplete();
      return;
    }

    setIsClaiming(true);
    setError(null);

    try {
      const tokenAddress = getTokenAddress(reward.tokenType);
      const amountInWei = BigInt(reward.amountInWei || '0');
      console.log(tokenAddress, amountInWei, reward.signature)
      console.log('Claiming token with:', {
        tokenAddress,
        amountInWei,
        signature: reward.signature
      });
      
      writeClaimToken({
        address: CONTRACT_ADDRESSES.TOKEN_REWARD as `0x${string}`,
        abi: TOKEN_REWARD_ABI,
        functionName: 'claimTokenReward',
        args: [tokenAddress, amountInWei, reward.signature]
      });
    } catch (error) {
      console.error('Error claiming token:', error);
      setError('Failed to claim token');
      setIsClaiming(false);
    }
  };

  // Store gift box claim in localStorage
  const storeGiftBoxClaim = (reward: GiftBoxReward) => {
    if (typeof window === 'undefined') return;
    
    try {
      const existingClaims = JSON.parse(localStorage.getItem('giftBoxClaims') || '[]');
      const newClaim = {
        tokenType: reward.tokenType,
        amount: reward.amount,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      };
      
      existingClaims.push(newClaim);
      localStorage.setItem('giftBoxClaims', JSON.stringify(existingClaims));
      
      // Update total rewards
      const existingTotals = JSON.parse(localStorage.getItem('giftBoxTotals') || '{"arb": 0, "pepe": 0, "boop": 0, "totalClaims": 0}');
      existingTotals.totalClaims += 1;
      
      if (reward.tokenType !== 'none') {
        existingTotals[reward.tokenType] += reward.amount;
      }
      
      localStorage.setItem('giftBoxTotals', JSON.stringify(existingTotals));
      
      console.log('Gift box claim stored in localStorage:', newClaim);
    } catch (error) {
      console.error('Failed to store gift box claim:', error);
    }
  };

  // Handle successful token claim
  useEffect(() => {
    if (isClaimConfirmed && isClaiming && reward) {
      setIsClaiming(false);
      setShowSuccess(true);
      
      // Store the claim in localStorage
      storeGiftBoxClaim(reward);
      
      // Share the winning on Farcaster
      shareWinning(reward);
      
      // Auto close success popup after 3 seconds
      setTimeout(() => {
        onClaimComplete();
      }, 5000);
    }
  }, [isClaimConfirmed, isClaiming, onClaimComplete, reward]);

  // Handle token claim error
  useEffect(() => {
    if (claimError && isClaiming) {
      setError(claimErrorObj?.message || 'Token claim failed');
      setIsClaiming(false);
    }
  }, [claimError, claimErrorObj, isClaiming]);

  const getTokenAddress = (tokenType: 'arb' | 'pepe' | 'boop' | 'none'): string => {
    switch (tokenType) {
      case 'arb':
        return '0x912CE59144191C1204E64559FE8253a0e49E6548';
      case 'pepe':
        return '0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00';
      case 'boop':
        return '0x13A7DeDb7169a17bE92B0E3C7C2315B46f4772B3'; // Replace with actual BOOP address
      case 'none':
        throw new Error('Cannot get token address for "none" type');
      default:
        throw new Error('Invalid token type');
    }
  };

  const getTokenInfo = (tokenType: 'arb' | 'pepe' | 'boop' | 'none') => {
    switch (tokenType) {
      case 'arb':
        return { name: '$ARB', color: 'text-blue-400', icon: '/candy/arb.png' };
      case 'pepe':
        return { name: '$PEPE', color: 'text-green-400', icon: '/candy/2.png' };
      case 'boop':
        return { name: '$BOOP', color: 'text-purple-400', icon: '/candy/1.png' };
      case 'none':
        return { name: 'Better Luck Next Time!', color: 'text-gray-400', icon: '😔' };
      default:
        return { name: 'Unknown', color: 'text-gray-400', icon: '❓' };
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.95) 100%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [-20, -100],
              x: [0, Math.random() * 40 - 20]
            }}
            transition={{
              duration: 2,
              delay: particle.delay,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      {/* Main Gift Box Container */}
      <motion.div 
        initial={{ scale: 0.8, rotateY: -15 }}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative"
        style={{
          maxWidth: '450px',
          width: '100%',
          perspective: '1000px'
        }}
      >
        {/* 3D Gift Box Card */}
        <motion.div 
          className="glass-card neon-glow"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(147, 51, 234, 0.15) 50%, rgba(0, 230, 118, 0.1) 100%)',
            border: '2px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '32px',
            padding: '40px',
            textAlign: 'center',
            position: 'relative',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px -12px rgba(0, 255, 255, 0.3), 0 0 30px rgba(147, 51, 234, 0.2)',
            transformStyle: 'preserve-3d'
          }}
          animate={{
            rotateX: boxAnimation === 'shaking' ? [0, -5, 5, -5, 5, 0] : 0,
            rotateY: boxAnimation === 'opening' ? [0, 10, -10, 0] : 0,
            scale: boxAnimation === 'opening' ? [1, 1.05, 1] : 1
          }}
          transition={{
            duration: boxAnimation === 'shaking' ? 1 : 0.5,
            ease: "easeInOut"
          }}
        >
          {/* Close button */}
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </motion.button>

          <AnimatePresence mode="wait">
            {showSuccess ? (
              // Success State
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotateY: -180 }}
                transition={{ duration: 0.6, type: "spring" }}
              >
                <motion.div
                  className="text-8xl mb-6"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  ✅
                </motion.div>
                
                <motion.h2 
                  className="text-3xl font-black text-white mb-4 holographic-text"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Successfully Claimed!
                </motion.h2>
                
                <motion.p 
                  className="text-white/80 mb-6 text-lg"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Your {reward!.amount.toLocaleString()} {getTokenInfo(reward!.tokenType).name} tokens have been claimed successfully!
                </motion.p>
                
                
                <motion.button
                  onClick={onClaimComplete}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <FontAwesomeIcon icon={faCheck} className="mr-2" />
                  Continue
                </motion.button>
              </motion.div>
            ) : !showReward ? (
              // Gift Box Closed State
              <motion.div
                key="closed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4 }}
              >
                {/* 3D Gift Box Icon */}
                <motion.div 
                  className="relative mb-8"
                  animate={{
                    rotateY: boxAnimation === 'shaking' ? [0, 15, -15, 15, -15, 0] : 0,
                    scale: boxAnimation === 'opening' ? [1, 1.2, 1] : 1
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="text-9xl relative"
                    style={{
                      filter: 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.5))',
                      transformStyle: 'preserve-3d'
                    }}
                    animate={{
                      rotateX: boxAnimation === 'opening' ? [0, 45, 0] : 0,
                      rotateZ: boxAnimation === 'shaking' ? [0, 5, -5, 5, -5, 0] : 0
                    }}
                  >
                    🎁
                  </motion.div>
                  
                  {/* Sparkle effects around the box */}
                  {boxAnimation === 'opening' && (
                    <>
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute text-yellow-400"
                          style={{
                            left: '50%',
                            top: '50%',
                            transform: `rotate(${i * 45}deg) translateY(-100px)`
                          }}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ 
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            rotate: [0, 360]
                          }}
                          transition={{
                            duration: 1.5,
                            delay: i * 0.1,
                            ease: "easeOut"
                          }}
                        >
                          <FontAwesomeIcon icon={faStar} />
                        </motion.div>
                      ))}
                    </>
                  )}
                </motion.div>
                
                <motion.h2 
                  className="text-3xl font-black text-white mb-4 holographic-text"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {isOpening ? 'Opening Gift Box...' : 'Congratulations!'}
                </motion.h2>
                
                <motion.p 
                  className="text-white/80 mb-8 text-lg"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {isOpening 
                    ? 'Your reward is being generated...' 
                    : 'You\'ve earned a gift box! Click to open and claim your reward.'
                  }
                </motion.p>

                {error && (
                  <motion.div 
                    className="bg-red-500/20 border border-red-400/30 text-red-300 px-6 py-4 rounded-2xl mb-6"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    {error}
                  </motion.div>
                )}

                {boxAnimation === 'idle' && (
                  <motion.button
                    onClick={openGiftBox}
                    disabled={isOpening}
                    className="w-full gaming-gradient text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-300 border border-cyan-500/20"
                    whileHover={{ scale: isOpening ? 1 : 1.05, y: isOpening ? 0 : -2 }}
                    whileTap={{ scale: isOpening ? 1 : 0.95 }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{
                      cursor: isOpening ? 'not-allowed' : 'pointer',
                      opacity: isOpening ? 0.7 : 1
                    }}
                  >
                    {isOpening ? (
                      <div className="flex items-center justify-center">
                        <motion.div
                          className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full mr-3"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Opening...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <FontAwesomeIcon icon={faGift} className="mr-3" />
                        Open Gift Box
                      </div>
                    )}
                  </motion.button>
                )}
                    </motion.div>
            ) : (
              // Gift Box Opened State
              <motion.div
                key="opened"
                initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotateY: -180 }}
                transition={{ duration: 0.6, type: "spring" }}
              >
                {/* Reward Display */}
                <motion.div 
                  className="mb-8"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  {reward!.tokenType !== 'none' ? (
                    <motion.img 
                      src={getTokenInfo(reward!.tokenType).icon} 
                      alt={getTokenInfo(reward!.tokenType).name}
                      className="w-24 h-24 mx-auto object-contain"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                      style={{
                        filter: 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.5))'
                      }}
                    />
                  ) : (
                    <motion.div
                      className="text-8xl"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    >
                      😔
                    </motion.div>
                  )}
              </motion.div>

                <motion.h2 
                  className="text-3xl font-black mb-4"
                  style={{
                    color: reward!.tokenType === 'arb' ? '#60a5fa' :
                           reward!.tokenType === 'pepe' ? '#4ade80' :
                           reward!.tokenType === 'boop' ? '#c4b5fd' :
                           '#9ca3af'
                  }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {getTokenInfo(reward!.tokenType).name}
                </motion.h2>

                {reward!.tokenType !== 'none' && (
              <motion.div
                    className="mb-8"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
              >
                <motion.div
                      className="text-4xl font-black text-white mb-2"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {reward!.amount.toLocaleString()}
                    </motion.div>
                    <div className="text-white/80 text-lg">
                      {getTokenInfo(reward!.tokenType).name} Tokens
                    </div>
                  </motion.div>
                )}

                <motion.div 
                  className="mb-8 text-white/60"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-sm mb-1">
                    Claims today: {reward!.claimsToday}/5
                  </div>
                  <div className="text-sm">
                    Remaining: {reward!.remainingClaims}
                  </div>
                </motion.div>

                {error && (
                  <motion.div 
                    className="bg-red-500/20 border border-red-400/30 text-red-300 px-6 py-4 rounded-2xl mb-6"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    {error}
                  </motion.div>
                )}

                  <motion.button
                  onClick={claimToken}
                  disabled={isClaiming || isClaimLoading}
                  className="w-full text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  style={{
                    cursor: (isClaiming || isClaimLoading) ? 'not-allowed' : 'pointer',
                    opacity: (isClaiming || isClaimLoading) ? 0.7 : 1,
                    background: (isClaiming || isClaimLoading)
                      ? 'linear-gradient(135deg, #4b5563, #374151)'
                      : reward!.tokenType === 'none'
                      ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
                      : 'linear-gradient(135deg, #22c55e, #10b981)'
                  }}
                >
                  {isClaiming || isClaimLoading ? (
                    <div className="flex items-center justify-center">
                      <motion.div
                        className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full mr-3"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Claiming...
                    </div>
                  ) : reward!.tokenType === 'none' ? (
                    <div className="flex items-center justify-center">
                      <FontAwesomeIcon icon={faCheck} className="mr-3" />
                      Continue
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <FontAwesomeIcon icon={faCoins} className="mr-3" />
                      Claim Tokens
                  </div>
                )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
