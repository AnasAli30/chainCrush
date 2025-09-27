'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShuffle, 
  faBurst, 
  faCoins,
  faCheckCircle,
  faSpinner,
  faExclamationTriangle,
  faShoppingCart,
  faMinus,
  faPlus,
  faWallet,
  faBolt
} from '@fortawesome/free-solid-svg-icons';
import { useAccount, useWalletClient, useBalance } from 'wagmi';
import { erc20Abi, encodeFunctionData, parseUnits, formatUnits } from 'viem';
import { authenticatedFetch } from '@/lib/auth';
import { sdk } from '@farcaster/miniapp-sdk'

// Contract configuration
const BOOSTER_SHOP_ADDRESS = '0x31c72c62aD07f50a51660F39f601ffdA16B427B3';
const CRSH_TOKEN_ADDRESS = '0xe461003E78A7bF4F14F0D30b3ac490701980aB07';

interface BoosterItem {
  id: number;
  name: string;
  description: string;
  price: number;
  icon: any;
  type: number;
}

interface UserBoosters {
  shuffle: number;
  partyPopper: number;
}

interface ShopPageProps {
  fid?: number;
}

const ShopPage: React.FC<ShopPageProps> = ({ fid }) => {
  const [selectedBooster, setSelectedBooster] = useState<BoosterItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [userBoosters, setUserBoosters] = useState<UserBoosters>({ shuffle: 0, partyPopper: 0 });
  const [loading, setLoading] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [purchasedBooster, setPurchasedBooster] = useState<{name: string, quantity: number, totalCost: number} | null>(null);
  const [showInsufficientFundsPopup, setShowInsufficientFundsPopup] = useState(false);
  const [requiredAmount, setRequiredAmount] = useState(0);
  const [boostersLoading, setBoostersLoading] = useState(true);

  // Debug popup state changes
  useEffect(() => {
    console.log('Popup state changed:', showSuccessPopup, 'Purchased booster:', purchasedBooster);
  }, [showSuccessPopup, purchasedBooster]);

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  // Check CRSH token balance
  const { data: crshBalance } = useBalance({
    address: address,
    token: CRSH_TOKEN_ADDRESS as `0x${string}`,
  });

  const boosterItems: BoosterItem[] = [
    {
      id: 0,
      name: 'Shuffle',
      description: 'Rearrange all candies on the board for a fresh start',
      price: 30000,
      icon: faShuffle,
      type: 0
    },
    {
      id: 1,
      name: 'Party Popper',
      description: 'Destroy a large area of candies with explosive power',
      price: 30000,
      icon: faBurst,
      type: 1
    }
  ];

  // Fetch user's booster inventory
  useEffect(() => {
    if (fid) {
      fetchUserBoosters();
    } else {
      setBoostersLoading(false); // Don't show loading if no fid
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

  const handleSwapToken = async (requiredCrsh: number) => {
    try {
      // Calculate required USDC amount (1 USDC = 0.4 CRSH, so 1 CRSH = 2.5 USDC)
      const requiredUsdc = requiredCrsh * 2.5; // More than needed to ensure enough CRSH
      const sellAmount = (requiredUsdc * 1e6).toString(); // USDC has 6 decimals
      
      // Use Farcaster SDK to open swap
      await sdk.actions.swapToken({
        sellToken: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
        buyToken: `eip155:42161/erc20:${CRSH_TOKEN_ADDRESS}`, // CRSH on CRSHitrum
        sellAmount: sellAmount,
      });
    } catch (error) {
      console.error('Swap error:', error);
      throw error;
    }
  };

  const handleSwapNow = async () => {
    try {
      setShowInsufficientFundsPopup(false);
      await handleSwapToken(requiredAmount);
    } catch (error) {
      console.error('Swap failed:', error);
      setErrorMessage('Failed to open swap. Please try again.');
    }
  };

  const handleLater = () => {
    setShowInsufficientFundsPopup(false);
    setRequiredAmount(0);
  };

  const handlePurchase = async () => {
    if (!selectedBooster || !address || !fid || !walletClient) return;

    setLoading(true);
    setPurchaseStatus('pending');
    setErrorMessage('');

    try {
      const totalCost = selectedBooster.price * quantity;
      const totalCostWei = parseUnits(totalCost.toString(), 18);
      
      // Check if user has enough CRSH balance
      const currentBalance = crshBalance ? parseFloat(formatUnits(crshBalance.value, crshBalance.decimals)) : 0;
      
      if (currentBalance < totalCost) {
        // Not enough CRSH, show popup to ask user what to do
        setRequiredAmount(totalCost);
        setShowInsufficientFundsPopup(true);
        setLoading(false);
        return;
      }

      // Send the batched calls
      const { id } = await walletClient.sendCalls({
        account: address as `0x${string}`,
        calls: [
          // Approve CRSH tokens
          {
            to: CRSH_TOKEN_ADDRESS as `0x${string}`,
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
        
        // Store purchase info for success popup
        setPurchasedBooster({
          name: selectedBooster.name,
          quantity: quantity,
          totalCost: selectedBooster.price * quantity
        });
        
        // Call API to update database and show popup
        console.log('Transaction successful, calling API...');
        await handleConfirmPurchase(txHash);
        
        // Show success popup after API call
        console.log('API call completed, showing popup...');
        setShowSuccessPopup(true);
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error: any) {
      console.error('Purchase error:', error);
      setPurchaseStatus('error');
      
      // Handle user rejection gracefully
      if (error.message && error.message.includes('User rejected the request')) {
        setErrorMessage('Transaction was cancelled. You can try again when ready.');
      } else if (error.message && error.message.includes('insufficient funds')) {
        setErrorMessage('Insufficient CRSH balance. Please add more tokens to your wallet.');
      } else if (error.message && error.message.includes('gas')) {
        setErrorMessage('Transaction failed due to gas issues. Please try again.');
      } else {
        setErrorMessage('Purchase failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPurchase = async (txHash?: string) => {
    const hashToUse = txHash || transactionHash;
    if (!selectedBooster || !hashToUse) return;

    try {
      // Call API to update database
      const response = await authenticatedFetch('/api/purchase-booster', {
        method: 'POST',
        body: JSON.stringify({
          fid: fid,
          boosterType: selectedBooster.type,
          quantity: quantity,
          transactionHash: hashToUse
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('API response successful, refreshing boosters...');
        // Refresh user boosters to get accurate count
        await fetchUserBoosters();
        console.log('Boosters refreshed successfully');
        
        // Reset purchase state after popup is shown (moved to main flow)
        setTimeout(() => {
          console.log('Resetting purchase state...');
          setPurchaseStatus('idle');
          setSelectedBooster(null);
          setQuantity(1);
          setTransactionHash('');
          setShowSuccessPopup(false);
          setPurchasedBooster(null);
        }, 4000);
      } else {
        throw new Error(data.error || 'Failed to confirm purchase');
      }
    } catch (error: any) {
      console.error('Confirm purchase error:', error);
      setPurchaseStatus('error');
      setErrorMessage(error.message || 'Failed to confirm purchase');
    }
  };

  const adjustQuantity = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 100) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div className="space-y-6">
      {/* Special Discount Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500/20 to-orange-500/20 p-4 border border-red-400/30 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
              <FontAwesomeIcon icon={faBolt} className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">🔥 Special Discount!</h3>
              <p className="text-red-200 text-sm">Limited time offer</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">30K</div>
            <div className="text-red-200 text-xs">CRSH each</div>
          </div>
        </div>
      </motion.div>

      {/* User Boosters Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-6 border border-white/10 backdrop-blur-sm"
      >
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faShoppingCart} className="text-purple-400" />
            Your Boosters
          </h3>
          
          {boostersLoading ? (
            // Skeleton Loader
            <div className="grid grid-cols-2 gap-4">
              {/* Shuffle Skeleton */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl animate-pulse"
                  style={{
                    background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.3) 25%, rgba(59, 130, 246, 0.6) 50%, rgba(59, 130, 246, 0.3) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                  }}
                />
                <div className="flex-1">
                  <div 
                    className="h-4 w-16 rounded mb-2 animate-pulse"
                    style={{
                      background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.3) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite'
                    }}
                  />
                  <div 
                    className="h-3 w-8 rounded animate-pulse"
                    style={{
                      background: 'linear-gradient(90deg, rgba(156, 163, 175, 0.3) 25%, rgba(156, 163, 175, 0.6) 50%, rgba(156, 163, 175, 0.3) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite'
                    }}
                  />
                </div>
              </div>
              
              {/* Party Popper Skeleton */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl animate-pulse"
                  style={{
                    background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.3) 25%, rgba(239, 68, 68, 0.6) 50%, rgba(239, 68, 68, 0.3) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                  }}
                />
                <div className="flex-1">
                  <div 
                    className="h-4 w-20 rounded mb-2 animate-pulse"
                    style={{
                      background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.3) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite'
                    }}
                  />
                  <div 
                    className="h-3 w-8 rounded animate-pulse"
                    style={{
                      background: 'linear-gradient(90deg, rgba(156, 163, 175, 0.3) 25%, rgba(156, 163, 175, 0.6) 50%, rgba(156, 163, 175, 0.3) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite'
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Actual Content
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400/20 to-blue-600/20 flex items-center justify-center border border-blue-400/30">
                  <FontAwesomeIcon icon={faShuffle} className="text-2xl text-blue-400" />
                </div>
                <div>
                  <div className="text-white font-semibold">Shuffle</div>
                  <div className="text-gray-300 text-sm">x{userBoosters.shuffle}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400/20 to-red-600/20 flex items-center justify-center border border-red-400/30">
                  <FontAwesomeIcon icon={faBurst} className="text-2xl text-red-400" />
                </div>
                <div>
                  <div className="text-white font-semibold">Party Popper</div>
                  <div className="text-gray-300 text-sm">x{userBoosters.partyPopper}</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </motion.div>

      {/* CRSH Balance Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4 border border-white/10 backdrop-blur-sm"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-600/20 flex items-center justify-center border border-yellow-400/30">
                <FontAwesomeIcon icon={faCoins} className="text-xl text-yellow-400" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">CRSH Balance</div>
                <div className="text-gray-300 text-xs">
                  {crshBalance ? `${parseFloat(formatUnits(crshBalance.value, crshBalance.decimals)).toFixed(0)} CRSH` : 'Loading...'}
                </div>
              </div>
            </div>
            {crshBalance && selectedBooster && (
              <div className="text-right">
                <div className="text-white font-bold text-sm">
                  Need: {(selectedBooster.price * quantity).toFixed(0)} CRSH
                </div>
                <div className={`text-xs ${parseFloat(formatUnits(crshBalance.value, crshBalance.decimals)) >= (selectedBooster.price * quantity) ? 'text-green-400' : 'text-red-400'}`}>
                  {parseFloat(formatUnits(crshBalance.value, crshBalance.decimals)) >= (selectedBooster.price * quantity) ? 'Sufficient' : 'Insufficient'}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </motion.div>

      {/* Booster Selection */}
      <div className="grid grid-cols-1 gap-4">
        {boosterItems.map((booster, index) => (
          <motion.div
            key={booster.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedBooster(booster)}
            className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all border backdrop-blur-sm ${
              selectedBooster?.id === booster.id
                ? 'bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border-yellow-400/50'
                : 'bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:border-white/30'
            }`}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center border ${
                    booster.id === 0 
                      ? 'bg-gradient-to-br from-blue-400/20 to-blue-600/20 border-blue-400/30' 
                      : 'bg-gradient-to-br from-red-400/20 to-red-600/20 border-red-400/30'
                  }`}>
                    <FontAwesomeIcon 
                      icon={booster.icon} 
                      className={`text-3xl ${
                        booster.id === 0 ? 'text-blue-400' : 'text-red-400'
                      }`} 
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{booster.name}</h3>
                    <div className="flex items-center gap-2 text-yellow-400">
                      <FontAwesomeIcon icon={faCoins} />
                      <span className="font-semibold">{booster.price} CRSH</span>
                    </div>
                  </div>
                </div>
                {selectedBooster?.id === booster.id && (
                  <FontAwesomeIcon icon={faCheckCircle} className="text-2xl text-yellow-400" />
                )}
              </div>
              <p className="text-gray-300 text-sm">{booster.description}</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        ))}
      </div>

      {/* Quantity Selection */}
      {selectedBooster && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-6 border border-white/20 backdrop-blur-sm"
        >
          <div className="relative z-10">
            <h3 className="text-lg font-semibold text-white mb-4">Select Quantity</h3>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => adjustQuantity(-1)}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-400/30 flex items-center justify-center text-white hover:from-red-500/30 hover:to-red-600/30 transition-all"
              >
                <FontAwesomeIcon icon={faMinus} />
              </button>
              <div className="text-3xl font-bold text-white min-w-[80px] text-center">
                {quantity}
              </div>
              <button
                onClick={() => adjustQuantity(1)}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-400/30 flex items-center justify-center text-white hover:from-green-500/30 hover:to-green-600/30 transition-all"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
            <div className="text-center mt-4 text-gray-300">
              Total: <span className="text-yellow-400 font-semibold">{(selectedBooster.price * quantity).toFixed(1)} CRSH</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {purchaseStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/20 p-4 border border-red-400/30 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400" />
            <div className="text-red-100">{errorMessage}</div>
          </div>
        </motion.div>
      )}

      {/* Purchase Button */}
      {selectedBooster && (
        <motion.button
          onClick={handlePurchase}
          disabled={loading || !address}
          className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 ${
            !address
              ? 'bg-gray-500 cursor-not-allowed'
              : loading
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
          }`}
          whileHover={!loading && address ? { scale: 1.02 } : {}}
          whileTap={!loading && address ? { scale: 0.98 } : {}}
        >
          {loading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              Processing...
            </>
          ) : !address ? (
            <>
              <FontAwesomeIcon icon={faWallet} />
              Connect Wallet
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faShoppingCart} />
              Purchase {quantity}x {selectedBooster.name}
            </>
          )}
        </motion.button>
      )}

      {!address && (
        <div className="text-center text-yellow-300 text-sm">
          Please connect your wallet to purchase boosters
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && purchasedBooster && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 bg-opacity-50 flex items-start justify-center z-50 p-4"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 max-w-md w-full text-white text-center border border-green-400/30 shadow-2xl"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-white" />
            </motion.div>

            {/* Success Message */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold mb-4"
            >
              Purchase Successful!
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <p className="text-lg mb-2">
                You bought <span className="font-bold">{purchasedBooster.quantity}x {purchasedBooster.name}</span> booster{purchasedBooster.quantity > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-green-100">
                Total: <span className="font-semibold">{purchasedBooster.totalCost.toFixed(1)} CRSH</span>
              </p>
              {transactionHash && (
                <p className="text-xs text-green-200 mt-2">
                  TX: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                </p>
              )}
            </motion.div>

            {/* Animated Booster Icons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center gap-4 mb-6"
            >
              {Array.from({ length: purchasedBooster.quantity }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, type: "spring", stiffness: 300 }}
                  className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"
                >
                  <FontAwesomeIcon 
                    icon={purchasedBooster.name === 'Shuffle' ? faShuffle : faBurst} 
                    className={`text-2xl ${purchasedBooster.name === 'Shuffle' ? 'text-blue-400' : 'text-red-400'}`} 
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Continue Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onClick={() => {
                setShowSuccessPopup(false);
                setPurchasedBooster(null);
                setPurchaseStatus('idle');
                setSelectedBooster(null);
                setQuantity(1);
                setTransactionHash('');
              }}
              className="bg-white text-green-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg  cursor-pointer"
            >
              Continue Shopping
            </motion.button>

            {/* Background Animation */}
            {/* <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-20 animate-pulse" /> */}
          </motion.div>
        </motion.div>
      )}

      {/* Insufficient Funds Popup */}
      {showInsufficientFundsPopup && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 bg-opacity-60 flex items-center justify-center z-50 p-4"
          style={{ zIndex: 9999 }}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative"
            style={{
              background: `
                linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(251, 146, 60, 0.15) 50%, rgba(59, 130, 246, 0.15) 100%),
                linear-gradient(45deg, rgba(239, 68, 68, 0.08) 0%, rgba(251, 146, 60, 0.08) 50%, rgba(59, 130, 246, 0.08) 100%)
              `,
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '20px',
              boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(239, 68, 68, 0.1)',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center'
            }}
          >
            {/* Warning Icon */}
            <div className="relative mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                  boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)'
                }}
              >
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-white text-2xl" />
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
                className="absolute inset-0 rounded-full border-2 border-red-400"
                style={{ borderColor: 'rgba(239, 68, 68, 0.6)' }}
              />
            </div>

            {/* Warning Text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-xl font-bold text-white mb-2" style={{
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                Insufficient CRSH Balance
              </h2>
              <p className="text-red-200 text-sm mb-2">
                You need <span className="font-bold text-white">{requiredAmount.toFixed(0)} CRSH</span> to purchase this booster
              </p>
              <p className="text-red-300 text-xs mb-4">
                Current balance: <span className="font-bold text-yellow-400">{crshBalance ? parseFloat(formatUnits(crshBalance.value, crshBalance.decimals)).toFixed(0) : '0'} CRSH</span>
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-3"
            >
              <button
                onClick={handleLater}
                className="flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(107, 114, 128, 0.2)'
                }}
              >
                Later
              </button>
              
              <button
                onClick={handleSwapNow}
                className="flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faCoins} className="text-sm" />
                  Swap Now
                </div>
              </button>
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ShopPage;
