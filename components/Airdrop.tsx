'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGift,
  faCoins,
  faCheckCircle,
  faSpinner,
  faExclamationTriangle,
  faWallet,
  faSearch,
  faCopy,
  faExternalLinkAlt,
  faTrophy,
  faFire,
  faCalendar
} from '@fortawesome/free-solid-svg-icons';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';

interface AirdropData {
  address: string;
  amount: string;
}

interface ProofData {
  proof: string[];
  amount: string;
  account: string;
}

interface AirdropProps {
  fid?: number;
}

const Airdrop: React.FC<AirdropProps> = ({ fid }) => {
  const [airdropData, setAirdropData] = useState<AirdropData | null>(null);
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [loading, setLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [csvData, setCsvData] = useState<AirdropData[]>([]);
  const [claimStatus, setClaimStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const { address } = useAccount();
  const { actions } = useMiniAppContext();
  
  // Contract interaction hooks
  const { writeContract, data: hash, error: contractError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Load CSV data on component mount
  useEffect(() => {
    loadAirdropData();
  }, []);

  const loadAirdropData = async () => {
    try {
      const response = await fetch('/assets/airdrop.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n');
      const data: AirdropData[] = [];
      
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const [address, amount] = line.split(',');
          if (address && amount) {
            data.push({ address: address.trim(), amount: amount.trim() });
          }
        }
      }
      
      setCsvData(data);
    } catch (error) {
      console.error('Error loading airdrop data:', error);
      setError('Failed to load airdrop data');
    }
  };

  const checkAirdrop = async () => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');
    setAirdropData(null);

    try {
      // Search for the user's address in the CSV data
      const userAirdrop = csvData.find(item => 
        item.address.toLowerCase() === address.toLowerCase()
      );

      if (userAirdrop) {
        setAirdropData(userAirdrop);
        // Also fetch proof for claiming
        await fetchProof();
      } else {
        setError('No rewards found for your address');
      }
    } catch (error) {
      console.error('Error checking rewards:', error);
      setError('Failed to check rewards');
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const formatAmount = (amount: string) => {
    const num = parseInt(amount);
    return num.toLocaleString();
  };

  const shareRewardsMessage = async () => {
    if (!actions?.composeCast) return;

    const shareMessage = `Just claimed ${formatAmount(airdropData?.amount || '0')} $CRSH tokens on @ChainCrushdotfun ! 

Free money just sitting there waiting for me!💰 
If you haven't checked yet, you might be missing out! 

Go claim yours now! 🚀`;

    try {
      await actions.composeCast({
        text: shareMessage,
        embeds: [`https://farcaster.xyz/miniapps/djk3nS-wYTQu/chain-crush`,`https://farcaster.xyz/~/c/arbitrum:0xe461003e78a7bf4f14f0d30b3ac490701980ab07`]
      });
    } catch (error) {
      console.error('Error sharing rewards:', error);
    }
  };

  // Handle transaction status updates
  useEffect(() => {
    if (isPending) {
      setClaimStatus('pending');
      setTransactionHash(hash || null);
    } else if (isConfirming) {
      setClaimStatus('pending');
    } else if (isConfirmed) {
      setClaimStatus('success');
      setTransactionHash(hash || null);
      // Auto-share after successful claim
      setTimeout(() => {
        shareRewardsMessage();
      }, 1000);
    } else if (contractError) {
      setClaimStatus('error');
      setError('Transaction failed. Please try again.');
    }
  }, [isPending, isConfirming, isConfirmed, contractError, hash]);

  const fetchProof = async () => {
    if (!address) return;

    setClaimLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/airdrop-proof?claimerAddress=${address}`);
      const data = await response.json();

      if (data.success) {
        setProofData(data);
        return data;
      } else {
        setError(data.error || 'Failed to fetch proof');
        return null;
      }
    } catch (error) {
      console.error('Error fetching proof:', error);
      setError('Failed to fetch proof');
      return null;
    } finally {
      setClaimLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!address || !proofData) return;

    try {
      setClaimStatus('idle');
      setError('');

      const TOKEN_ADDRESS = "0xe461003e78a7bf4f14f0d30b3ac490701980ab07";
      const AIRDROP_CONTRACT = "0x8Cb6e0216e98A7ACF622DC2dD6a39F1b4FF37014";

      // ABI for the claim function
      const claimABI = {
        "inputs": [
          {"internalType": "address", "name": "token", "type": "address"},
          {"internalType": "address", "name": "recipient", "type": "address"},
          {"internalType": "uint256", "name": "allocatedAmount", "type": "uint256"},
          {"internalType": "bytes32[]", "name": "proof", "type": "bytes32[]"}
        ],
        "name": "claim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      };

      await writeContract({
        address: AIRDROP_CONTRACT as `0x${string}`,
        abi: [claimABI],
        functionName: 'claim',
        args: [
          TOKEN_ADDRESS as `0x${string}`,
          address as `0x${string}`,
          BigInt(proofData.amount),
          proofData.proof as `0x${string}`[]
        ]
      });

    } catch (error: any) {
      console.error('Claim error:', error);
      setClaimStatus('error');
      setError('Failed to claim rewards. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-6 border border-white/10 backdrop-blur-sm"
      >
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faGift} className="text-purple-400" />
            Rewards Checker
          </h3>
          <p className="text-gray-300 text-sm">
            Check if your wallet address is eligible for the $CRSH rewards
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </motion.div>

      {/* Wallet Address Display */}
      {address && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 border border-white/10 backdrop-blur-sm"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400/20 to-emerald-600/20 flex items-center justify-center border border-green-400/30">
                  <FontAwesomeIcon icon={faWallet} className="text-xl text-green-400" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Connected Wallet</div>
                  <div className="text-gray-300 text-xs font-mono">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                </div>
              </div>
              <button
                onClick={copyAddress}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white text-sm"
              >
                <FontAwesomeIcon icon={copied ? faCheckCircle : faCopy} className="text-xs" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Check Airdrop Button */}
      <motion.button
        onClick={checkAirdrop}
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {loading ? (
          <>
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            Checking Rewards...
          </>
        ) : !address ? (
          <>
            <FontAwesomeIcon icon={faWallet} />
            Connect Wallet First
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faSearch} />
            Check Rewards
          </>
        )}
      </motion.button>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/20 p-4 border border-red-400/30 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400" />
            <div className="text-red-100">{error}</div>
          </div>
        </motion.div>
      )}

      {/* Airdrop Result */}
      {airdropData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-6 border border-green-400/30 backdrop-blur-sm"
        >
          <div className="relative z-10">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-full flex items-center justify-center border border-green-400/30"
              >
                <FontAwesomeIcon icon={faCheckCircle} className="text-2xl text-green-400" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                🎉 Congratulations!
              </h3>
              
              <p className="text-gray-300 mb-6">
                You are eligible for the $CRSH rewards!
              </p>
              
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {formatAmount(airdropData.amount)} $CRSH
                </div>
                <div className="text-sm text-gray-300">
                  Reward Amount
                </div>
              </div>
              
              <div className="mt-4 text-xs text-gray-400">
                Address: {airdropData.address.slice(0, 6)}...{airdropData.address.slice(-4)}
              </div>
              
              {/* Share Button */}
              {actions?.composeCast && (
                <motion.button
                  onClick={shareRewardsMessage}
                  className="mt-3 w-full py-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} />
                  Share on Farcaster
                </motion.button>
              )}
              
              {/* Claim Button */}
              {proofData && (
                <motion.button
                  onClick={handleClaim}
                  disabled={claimStatus === 'pending' || claimStatus === 'success' || !address}
                  className={`mt-4 w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-3 ${
                    claimStatus === 'success'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 cursor-not-allowed'
                      : claimStatus === 'pending'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                  }`}
                  whileHover={claimStatus === 'idle' ? { scale: 1.02 } : {}}
                  whileTap={claimStatus === 'idle' ? { scale: 0.98 } : {}}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {claimStatus === 'success' ? (
                    <>
                      <FontAwesomeIcon icon={faCheckCircle} />
                      Rewards Claimed!
                    </>
                  ) : claimStatus === 'pending' ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faGift} />
                      Claim Rewards
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
        </motion.div>
      )}

       {/* Eligibility Criteria */}
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.4 }}
         className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-6 border border-white/10 backdrop-blur-sm"
       >
         <div className="relative z-10">
           <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
             <FontAwesomeIcon icon={faCoins} className="text-blue-400" />
             Rewards Eligibility
           </h4>
           <div className="space-y-4">
             {/* Top 100 Champions */}
             <div className="flex items-start gap-3">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400/20 to-orange-600/20 flex items-center justify-center border border-yellow-400/30 mt-1">
                 <FontAwesomeIcon icon={faTrophy} className="text-yellow-400 text-sm" />
               </div>
               <div>
                 <div className="text-white font-semibold text-sm">Top 100 Champions</div>
                 <div className="text-gray-300 text-xs">From the last season leaderboard</div>
               </div>
             </div>

             {/* Daily Streak */}
             <div className="flex items-start gap-3">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400/20 to-pink-600/20 flex items-center justify-center border border-red-400/30 mt-1">
                 <FontAwesomeIcon icon={faFire} className="text-red-400 text-sm" />
               </div>
               <div>
                 <div className="text-white font-semibold text-sm">Daily Streak Players</div>
                 <div className="text-gray-300 text-xs">Players maintaining a daily streak of 3+ days</div>
               </div>
             </div>
           </div>
           
           {/* Snapshot Date */}
           <div className="mt-4 pt-4 border-t border-white/10">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400/20 to-emerald-600/20 flex items-center justify-center border border-green-400/30">
                 <FontAwesomeIcon icon={faCalendar} className="text-green-400 text-sm" />
               </div>
               <div>
                 <div className="text-white font-semibold text-sm">Snapshot Date</div>
                 <div className="text-gray-300 text-xs">September 25, 2025</div>
               </div>
             </div>
           </div>
         </div>
         <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
       </motion.div>

      {!address && (
        <div className="text-center text-yellow-300 text-sm">
          Please connect your wallet to check rewards eligibility
        </div>
      )}

      {/* Claim Success Popup */}
      {claimStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 max-w-md w-full text-white text-center border border-green-400/30 shadow-2xl"
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
              Rewards Claimed Successfully!
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <p className="text-lg mb-2">
                You have successfully claimed your <span className="font-bold">{formatAmount(airdropData?.amount || '0')} $CRSH</span> rewards!
              </p>
              {transactionHash && (
                <p className="text-xs text-green-200 mt-2">
                  TX: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                </p>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-3"
            >
              <motion.button
                onClick={() => {
                  setClaimStatus('idle');
                  setTransactionHash(null);
                }}
                className="flex-1 bg-white text-green-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Continue
              </motion.button>
              
              {actions?.composeCast && (
                <motion.button
                  onClick={shareRewardsMessage}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-colors shadow-lg"
                >
                  Share
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Airdrop;
