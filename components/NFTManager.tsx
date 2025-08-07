'use client'

import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, CHAINCRUSH_NFT_ABI, TOKEN_REWARD_ABI, NFTTrait, TRAIT_NAMES, TRAIT_COLORS } from '@/lib/contracts';

interface NFT {
  tokenId: number;
  trait: NFTTrait;
  traitName: string;
  traitColor: string;
  rewardAmount?: number;
  isBurnable: boolean;
}

export default function NFTManager() {
  const { address } = useAccount();
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [rewardToken, setRewardToken] = useState<string>('');
  const [rewardAmount, setRewardAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAllNFTs, setShowAllNFTs] = useState(true);

  // Get all user's NFTs
  const { data: allUserNFTs } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_REWARD as `0x${string}`,
    abi: TOKEN_REWARD_ABI,
    functionName: 'getAllNFTsByAddress',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get user's balance to determine total NFTs
  const { data: userBalance } = useContractRead({
    address: CONTRACT_ADDRESSES.CHAINCRUSH_NFT as `0x${string}`,
    abi: CHAINCRUSH_NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Burn NFT for reward
  const { writeContract: burnNFT, data: burnData, isError: burnError } = useContractWrite();

  const { isLoading: isBurning, isSuccess: burnSuccess } = useWaitForTransactionReceipt({
    hash: burnData,
  });

  // Load user's NFTs
  useEffect(() => {
    if (!address || !allUserNFTs) return;

    const loadNFTs = async () => {
      const nfts: NFT[] = [];
      
      // Load all user's NFTs
      console.log('All user NFTs:', allUserNFTs)
      if (Array.isArray(allUserNFTs)) {
        for (const nftId of allUserNFTs) {
          try {
            const tokenId = Number(nftId);
            const trait = await getNFTTrait(tokenId);
            
            // Determine if NFT is burnable (Epic, Rare, Legendary)
            const isBurnable = trait === NFTTrait.Epic || trait === NFTTrait.Rare || trait === NFTTrait.Legendary;
            
            const nft: NFT = {
              tokenId,
              trait,
              traitName: TRAIT_NAMES[trait],
              traitColor: TRAIT_COLORS[trait],
              rewardAmount: 0,
              isBurnable
            };
            nfts.push(nft);
          } catch (error) {
            console.error(`Error loading NFT ${nftId}:`, error);
          }
        }
      }
      
      setUserNFTs(nfts);
    };

    loadNFTs();
  }, [address, allUserNFTs]);

  const getNFTTrait = async (tokenId: number): Promise<NFTTrait> => {
    try {
      const response = await fetch('/api/get-nft-trait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId })
      });
      
      const result = await response.json();
      return result.trait;
    } catch (error) {
      console.error(`Error getting trait for token ${tokenId}:`, error);
      return NFTTrait.Common; // Default fallback
    }
  };

  const handleBurnNFT = async (nft: NFT) => {
    if (!address || !rewardToken || !rewardAmount || !nft.isBurnable) return;

    setIsLoading(true);
    try {
      // Get signature from server
      const response = await fetch('/api/burn-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          tokenId: nft.tokenId,
          rewardToken,
          rewardAmount: rewardAmount // Send as string, parse on server side
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      // Burn NFT
      burnNFT({
        address: CONTRACT_ADDRESSES.TOKEN_REWARD as `0x${string}`,
        abi: TOKEN_REWARD_ABI,
        functionName: 'burnNFTForReward',
        args: [BigInt(nft.tokenId), rewardToken as `0x${string}`, BigInt(result.data.rewardAmount), result.data.signature]
      });
    } catch (error) {
      console.error('Error burning NFT:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="p-4 text-center">
        <p>Please connect your wallet to view your NFTs</p>
      </div>
    );
  }

  const filteredNFTs = showAllNFTs ? userNFTs : userNFTs.filter(nft => nft.isBurnable);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Your ChainCrush NFTs</h2>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showAllNFTs}
              onChange={(e) => setShowAllNFTs(e.target.checked)}
              className="mr-2"
            />
            Show All NFTs
          </label>
        </div>
      </div>
      
      {userNFTs.length === 0 ? (
        <div className="text-gray-500">
          <p>No NFTs found. Play the game to earn NFTs!</p>
          <div className="mt-2 text-xs">
            <p>Debug Info:</p>
            <p>Address: {address}</p>
            <p>User Balance: {userBalance ? Number(userBalance) : 'Loading...'}</p>
            <p>All NFTs: {Array.isArray(allUserNFTs) ? allUserNFTs.length : 'Loading...'}</p>
            <p>All NFT IDs: {Array.isArray(allUserNFTs) ? allUserNFTs.map(id => Number(id)).join(', ') : 'None'}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mb-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Reward Token Address:</label>
              <input
                type="text"
                value={rewardToken}
                onChange={(e) => setRewardToken(e.target.value)}
                placeholder="0x..."
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Reward Amount (tokens):</label>
              <input
                type="number"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                placeholder="100"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNFTs.map((nft) => (
              <div
                key={nft.tokenId}
                className={`border rounded-lg p-4 ${!nft.isBurnable ? 'opacity-60' : ''}`}
                style={{ borderColor: nft.traitColor }}
              >
                <div className="text-center">
                  <h3 className="font-bold text-lg" style={{ color: nft.traitColor }}>
                    {nft.traitName} NFT
                  </h3>
                  <p className="text-sm text-gray-600">Token ID: {nft.tokenId}</p>
                  {!nft.isBurnable && (
                    <p className="text-xs text-gray-500 mt-1">(Not burnable)</p>
                  )}
                  {nft.rewardAmount && (
                    <p className="text-sm font-medium">
                      Reward: {nft.rewardAmount} tokens
                    </p>
                  )}
                  <button
                    onClick={() => handleBurnNFT(nft)}
                    disabled={isLoading || !rewardToken || !rewardAmount || !nft.isBurnable}
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                  >
                    {isLoading ? 'Burning...' : 'Burn for Reward'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>Total NFTs: {userNFTs.length}</p>
            <p>Burnable NFTs: {userNFTs.filter(nft => nft.isBurnable).length}</p>
            <p>User Balance: {userBalance ? Number(userBalance) : 0}</p>
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
              <p><strong>Debug Info:</strong></p>
              <p>NFT Contract: {CONTRACT_ADDRESSES.CHAINCRUSH_NFT}</p>
              <p>Token Reward Contract: {CONTRACT_ADDRESSES.TOKEN_REWARD}</p>
              <p>User Address: {address}</p>
              <p>All NFTs Array: {Array.isArray(allUserNFTs) ? JSON.stringify(allUserNFTs.map(id => Number(id))) : 'Not loaded'}</p>
            </div>
          </div>
        </div>
      )}
      
      {burnSuccess && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
          <p className="text-green-700">NFT burned successfully! Check your wallet for rewards.</p>
        </div>
      )}
      
      {burnError && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">Error burning NFT. Please try again.</p>
        </div>
      )}
    </div>
  );
} 