'use client'

import { useEffect, useState } from 'react';
import { useContractWrite, useContractRead, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, CHAINCRUSH_NFT_ABI } from '@/lib/contracts';

export function useWagmiClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only return wagmi hooks if we're on the client
  if (!isClient) {
    return {
      address: undefined,
      mintNFT: undefined,
      mintData: undefined,
      isMintError: false,
      mintErrorObj: undefined,
      isMinting: false,
      mintSuccess: false,
      totalSupply: undefined,
      remainingSupply: undefined,
      canMintToday: false,
      remainingMintsToday: 0,
    };
  }

  const { address } = useAccount();
  const { writeContract: mintNFT, data: mintData, isError: isMintError, error: mintErrorObj } = useContractWrite();
  const { isLoading: isMinting, isSuccess: mintSuccess } = useWaitForTransactionReceipt({ hash: mintData });

  const { data: totalSupply } = useContractRead({
    address: CONTRACT_ADDRESSES.CHAINCRUSH_NFT as `0x${string}`,
    abi: CHAINCRUSH_NFT_ABI,
    functionName: 'totalSupply',
  });

  const { data: remainingSupply } = useContractRead({
    address: CONTRACT_ADDRESSES.CHAINCRUSH_NFT as `0x${string}`,
    abi: CHAINCRUSH_NFT_ABI,
    functionName: 'remainingSupply',
  });

  const { data: canMintToday } = useContractRead({
    address: CONTRACT_ADDRESSES.CHAINCRUSH_NFT as `0x${string}`,
    abi: CHAINCRUSH_NFT_ABI,
    functionName: 'canMintToday',
    args: [address as `0x${string}`],
  });

  const { data: remainingMintsToday } = useContractRead({
    address: CONTRACT_ADDRESSES.CHAINCRUSH_NFT as `0x${string}`,
    abi: CHAINCRUSH_NFT_ABI,
    functionName: 'remainingMintsToday',
    args: [address as `0x${string}`],
  });

  return {
    address,
    mintNFT,
    mintData,
    isMintError,
    mintErrorObj,
    isMinting,
    mintSuccess,
    totalSupply,
    remainingSupply,
    canMintToday: canMintToday || false,
    remainingMintsToday: remainingMintsToday || 0,
  };
}
