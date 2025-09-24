'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStore, 
  faShuffle, 
  faBurst, 
  faTimes, 
  faCoins,
  faCheckCircle,
  faSpinner,
  faExclamationTriangle,
  faShoppingCart,
  faMinus,
  faPlus,
  faBolt
} from '@fortawesome/free-solid-svg-icons';
import { useAccount, useWalletClient } from 'wagmi';
import { erc20Abi, encodeFunctionData, parseUnits } from 'viem';
import { authenticatedFetch } from '@/lib/auth';

// Contract configuration
const BOOSTER_SHOP_ADDRESS = '0x3F095701677F65F09E19B48e620f47EE725d3558'; // Replace with deployed contract address
const ARB_TOKEN_ADDRESS = '0x912CE59144191C1204E64559FE8253a0e49E6548'; // Arbitrum mainnet ARB

interface BoosterItem {
  id: number;
  name: string;
  description: string;
  price: number; // in ARB
  icon: any;
  type: number; // 0 = SHUFFLE, 1 = PARTY_POPPER
}

interface UserBoosters {
  shuffle: number;
  partyPopper: number;
}

interface ShopProps {
  onClose: () => void;
  fid?: number;
  onPurchaseComplete?: () => void;
}

const Shop: React.FC<ShopProps> = ({ onClose, fid, onPurchaseComplete }) => {
  const [selectedBooster, setSelectedBooster] = useState<BoosterItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [userBoosters, setUserBoosters] = useState<UserBoosters>({ shuffle: 0, partyPopper: 0 });
  const [loading, setLoading] = useState(false);
  const [boostersLoading, setBoostersLoading] = useState(true);
  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionHash, setTransactionHash] = useState('');

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const boosterItems: BoosterItem[] = [
    {
      id: 0,
      name: 'Shuffle',
      description: 'Rearrange all candies',
      price: 0.2,
      icon: faShuffle,
      type: 0
    },
    {
      id: 1,
      name: 'Party Popper',
      description: 'Destroy large area',
      price: 0.1,
      icon: faBurst,
      type: 1
    }
  ];

  // Fetch user's booster inventory
  useEffect(() => {
    if (fid) {
      fetchUserBoosters();
    }
  }, [fid]);

  const fetchUserBoosters = async () => {
    setBoostersLoading(true);
    try {
      const response = await authenticatedFetch(`/api/purchase-booster?fid=${fid}`);
      const data = await response.json();
      
      if (data.success) {
        setUserBoosters(data.data.boosters);
      }
    } catch (error) {
      console.error('Error fetching user boosters:', error);
    } finally {
      setBoostersLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedBooster || !address || !fid || !walletClient) return;

    setLoading(true);
    setPurchaseStatus('pending');
    setErrorMessage('');

    try {
      const totalCost = selectedBooster.price * quantity;
      const totalCostWei = parseUnits(totalCost.toString(), 18);

      // Send the batched calls
      const { id } = await walletClient.sendCalls({
        account: address as `0x${string}`,
        calls: [
          // Approve ARB tokens
          {
            to: ARB_TOKEN_ADDRESS as `0x${string}`,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'approve',
              args: [BOOSTER_SHOP_ADDRESS as `0x${string}`, totalCostWei]
            })
          },
          // Buy boosters
          {
            to: BOOSTER_SHOP_ADDRESS as `0x${string}`,
            data: encodeFunctionData({
              abi: [
                {
                  "inputs": [
                    { "name": "fid", "type": "uint256" },
                    { "name": "boosterType", "type": "uint8" },
                    { "name": "quantity", "type": "uint256" }
                  ],
                  "name": "buyBoosters",
                  "outputs": [],
                  "stateMutability": "nonpayable",
                  "type": "function"
                }
              ],
              functionName: 'buyBoosters',
              args: [BigInt(fid), selectedBooster.type, BigInt(quantity)]
            })
          }
        ]
      });

      // Wait for the calls to complete
      const result = await walletClient.waitForCallsStatus({ id });

      if (result.status === 'success' && result.receipts && result.receipts.length > 0) {
        // Get the transaction hash from the last receipt (the buyBoosters call)
        const txHash = result.receipts[result.receipts.length - 1].transactionHash;
        setTransactionHash(txHash);
        setPurchaseStatus('success');
        
        // Call API to update database
        await handleConfirmPurchase(txHash);
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error: any) {
      console.error('Purchase error:', error);
      setPurchaseStatus('error');
      
      // Handle specific error messages
      if (error.message?.includes('User rejected')) {
        setErrorMessage('Transaction cancelled by user');
      } else if (error.message?.includes('insufficient funds')) {
        setErrorMessage('Insufficient ARB balance');
      } else if (error.message?.includes('gas')) {
        setErrorMessage('Transaction failed - try again');
      } else {
        setErrorMessage(error.message || 'Purchase failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPurchase = async (txHash: string) => {
    if (!selectedBooster || !txHash) return;

    try {
      // Call API to update database
      const response = await authenticatedFetch('/api/purchase-booster', {
        method: 'POST',
        body: JSON.stringify({
          fid: fid,
          boosterType: selectedBooster.type,
          quantity: quantity,
          transactionHash: txHash
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setUserBoosters(prev => ({
          ...prev,
          [data.data.boosterType === 'shuffle' ? 'shuffle' : 'partyPopper']: 
            prev[data.data.boosterType === 'shuffle' ? 'shuffle' : 'partyPopper'] + quantity
        }));
        
        // Refresh user boosters to get accurate count
        setBoostersLoading(true);
        await fetchUserBoosters();
        
        // Call the purchase complete callback
        if (onPurchaseComplete) {
          onPurchaseComplete();
        }
        
        // Reset purchase state after a short delay
        setTimeout(() => {
          setPurchaseStatus('idle');
          setSelectedBooster(null);
          setQuantity(1);
          setTransactionHash('');
        }, 3000);
      } else {
        throw new Error(data.error || 'Failed to confirm purchase');
      }
    } catch (error: any) {
      console.error('Confirm purchase error:', error);
      setPurchaseStatus('error');
      setErrorMessage(error.message || 'Failed to confirm purchase');
    }
  };

  if (purchaseStatus === 'success') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative"
          style={{
            background: `
              linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(34, 197, 94, 0.15) 50%, rgba(59, 130, 246, 0.15) 100%),
              linear-gradient(45deg, rgba(16, 185, 129, 0.08) 0%, rgba(34, 197, 94, 0.08) 50%, rgba(59, 130, 246, 0.08) 100%)
            `,
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '20px',
            boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(16, 185, 129, 0.1)',
            padding: '24px',
            maxWidth: '360px',
            width: '100%',
            textAlign: 'center'
          }}
        >
          {/* Success Icon with Animation */}
          <div className="relative mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)'
              }}
            >
              <FontAwesomeIcon icon={faCheckCircle} className="text-white text-2xl" />
            </motion.div>
            
            {/* Pulse Ring Animation */}
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ 
                delay: 0.5, 
                duration: 1, 
                repeat: Infinity, 
                repeatDelay: 2 
              }}
              className="absolute inset-0 rounded-full border-2 border-green-400"
              style={{ borderColor: 'rgba(16, 185, 129, 0.6)' }}
            />
          </div>

          {/* Success Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-bold text-white mb-2" style={{
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              Purchase Successful!
            </h2>
            <p className="text-green-200 text-sm mb-1">
              You bought <span className="font-bold text-white">{quantity}</span> {selectedBooster?.name} booster(s)
            </p>
            <p className="text-green-300 text-xs mb-4">
              for <span className="font-bold text-yellow-400">{selectedBooster && (selectedBooster.price * quantity).toFixed(1)} ARB</span>
            </p>
          </motion.div>

          {/* Transaction Hash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-4 p-2 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <p className="text-xs text-gray-300">
              Transaction: <span className="font-mono text-green-300">{transactionHash.slice(0, 8)}...{transactionHash.slice(-6)}</span>
            </p>
          </motion.div>

          {/* Continue Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-full py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              color: '#059669',
              boxShadow: '0 4px 15px rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faCheckCircle} className="text-sm" />
              Continue Playing
            </div>
          </motion.button>

          {/* Decorative Elements */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
          <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4" style={{
      backdropFilter: 'blur(10px)',
      zIndex: 9999
    }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="relative"
        style={{
          background: `
            linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(236, 72, 153, 0.15) 100%),
            linear-gradient(45deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.08) 50%, rgba(236, 72, 153, 0.08) 100%)
          `,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          padding: '20px',
          maxWidth: '420px',
          width: '100%',
          maxHeight: '75vh',
          overflowY: 'auto'
        }}
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon 
              icon={faStore} 
              className="text-xl text-yellow-400"
              style={{ filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.6))' }}
            />
            <h1 className="text-lg font-bold text-white">Quick Shop</h1>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-300 transition-colors p-1"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Current Boosters - Compact */}
        <div 
          className="rounded-xl p-3 mb-5 border border-white/20"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <FontAwesomeIcon icon={faShoppingCart} className="text-blue-400 text-xs" />
            Your Boosters
          </h3>
          
          {boostersLoading ? (
            // Skeleton Loader
            <div className="grid grid-cols-2 gap-2">
              {/* Shuffle Skeleton */}
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.15)'
              }}>
                <div 
                  className="w-6 h-6 rounded-lg animate-pulse"
                  style={{
                    background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.3) 25%, rgba(59, 130, 246, 0.6) 50%, rgba(59, 130, 246, 0.3) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                  }}
                />
                <div className="flex-1">
                  <div 
                    className="h-3 w-6 rounded mb-1 animate-pulse"
                    style={{
                      background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.3) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite'
                    }}
                  />
                  <div 
                    className="h-2 w-8 rounded animate-pulse"
                    style={{
                      background: 'linear-gradient(90deg, rgba(147, 197, 253, 0.3) 25%, rgba(147, 197, 253, 0.6) 50%, rgba(147, 197, 253, 0.3) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite'
                    }}
                  />
                </div>
              </div>
              
              {/* Party Popper Skeleton */}
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)',
                border: '1px solid rgba(236, 72, 153, 0.15)'
              }}>
                <div 
                  className="w-6 h-6 rounded-lg animate-pulse"
                  style={{
                    background: 'linear-gradient(90deg, rgba(236, 72, 153, 0.3) 25%, rgba(236, 72, 153, 0.6) 50%, rgba(236, 72, 153, 0.3) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                  }}
                />
                <div className="flex-1">
                  <div 
                    className="h-3 w-6 rounded mb-1 animate-pulse"
                    style={{
                      background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.3) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite'
                    }}
                  />
                  <div 
                    className="h-2 w-8 rounded animate-pulse"
                    style={{
                      background: 'linear-gradient(90deg, rgba(252, 165, 165, 0.3) 25%, rgba(252, 165, 165, 0.6) 50%, rgba(252, 165, 165, 0.3) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite'
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Actual Content
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <FontAwesomeIcon icon={faShuffle} className="text-blue-400 text-sm" />
                <div>
                  <div className="text-white font-bold text-sm">{userBoosters.shuffle}</div>
                  <div className="text-blue-200 text-xs">Shuffle</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(239, 68, 68, 0.15) 100%)',
                border: '1px solid rgba(236, 72, 153, 0.2)'
              }}>
                <FontAwesomeIcon icon={faBurst} className="text-pink-400 text-sm" />
                <div>
                  <div className="text-white font-bold text-sm">{userBoosters.partyPopper}</div>
                  <div className="text-red-200 text-xs">Party Popper</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Purchase Grid */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faBolt} className="text-yellow-400 text-xs" />
            Quick Purchase
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {boosterItems.map((item, index) => (
              <motion.div
                key={item.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative cursor-pointer transition-all duration-200 ${
                  selectedBooster?.type === item.type 
                    ? 'ring-2 ring-yellow-400/60' 
                    : 'hover:shadow-lg'
                }`}
                onClick={() => {
                  setSelectedBooster(item);
                  setQuantity(1); // Reset quantity when selecting new booster
                }}
                style={{
                  background: selectedBooster?.type === item.type 
                    ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(255, 193, 7, 0.12) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: selectedBooster?.type === item.type 
                    ? '1px solid rgba(255, 215, 0, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '12px'
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: item.type === 0 
                        ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                        : 'linear-gradient(135deg, #ec4899 0%, #ef4444 100%)',
                      boxShadow: `0 3px 10px ${
                        item.type === 0 
                          ? 'rgba(59, 130, 246, 0.3)' 
                          : 'rgba(236, 72, 153, 0.3)'
                      }`
                    }}
                  >
                    <FontAwesomeIcon 
                      icon={item.icon} 
                      className="text-white text-sm"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white">{item.name}</h3>
                    <div className="flex items-center gap-1 text-yellow-400 font-semibold text-xs">
                      <FontAwesomeIcon icon={faCoins} className="text-xs" />
                      {item.price} ARB
                    </div>
                  </div>
                </div>
                
                <p className="text-blue-100 text-xs leading-relaxed">
                  {item.description}
                </p>
                
                {selectedBooster?.type === item.type && (
                  <div className="absolute top-2 right-2">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-white text-xs" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Compact Quantity & Purchase */}
        {selectedBooster && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {/* Quantity Selector */}
            <div className="flex items-center justify-between mb-4 p-3 rounded-lg" style={{
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(255, 193, 7, 0.08) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.2)'
            }}>
              <span className="text-white font-semibold text-sm">Quantity:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold transition-all duration-200 hover:scale-110"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <FontAwesomeIcon icon={faMinus} className="text-xs" />
                </button>
                
                <div className="text-lg font-bold text-white min-w-[35px] text-center">
                  {quantity}
                </div>
                
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold transition-all duration-200 hover:scale-110"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />
                </button>
              </div>
            </div>

            {/* Total & Purchase */}
            <div className="text-center">
              <div className="mb-3 p-3 rounded-lg" style={{
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%)',
                border: '1px solid rgba(255, 215, 0, 0.2)'
              }}>
                <div className="text-xs text-white mb-1">Total Cost:</div>
                <div className="text-xl font-bold text-yellow-400 flex items-center justify-center gap-1">
                  <FontAwesomeIcon icon={faCoins} className="text-sm" />
                  {selectedBooster ? (selectedBooster.price * quantity).toFixed(1) : 0} ARB
                </div>
              </div>
              
              <button
                onClick={handlePurchase}
                disabled={!selectedBooster || loading}
                className={`w-full py-3 px-4 rounded-lg font-bold text-base transition-all duration-200 ${
                  !selectedBooster || loading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'hover:scale-105 hover:shadow-xl'
                }`}
                style={{
                  background: !selectedBooster || loading 
                    ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: !selectedBooster || loading 
                    ? 'none'
                    : '0 6px 20px rgba(16, 185, 129, 0.4)',
                  color: 'white'
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-sm" />
                    Buy Now
                  </div>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {purchaseStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500 bg-opacity-20 border border-red-400 rounded-lg p-3 mt-4"
          >
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 text-sm" />
              <div className="text-red-100 text-sm">{errorMessage}</div>
            </div>
          </motion.div>
        )}

        {!address && (
          <div className="text-center mt-3 text-yellow-300 text-sm">
            Connect wallet to purchase
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Shop;