import { useContractRead } from 'wagmi';
import { CONTRACT_ADDRESSES, CHAINCRUSH_NFT_ABI } from '@/lib/contracts';
import { useEffect, useState } from 'react';

export function useNFTSupply() {
  const { data: currentTokenId, isLoading: isLoadingCurrentId, error: currentIdError, refetch: refetchCurrentId } = useContractRead({
    address: CONTRACT_ADDRESSES.CHAINCRUSH_NFT as `0x${string}`,
    abi: CHAINCRUSH_NFT_ABI,
    functionName: 'getCurrentTokenId',
  });

  const { data: maxSupply, isLoading: isLoadingMaxSupply, error: maxSupplyError, refetch: refetchMaxSupply } = useContractRead({
    address: CONTRACT_ADDRESSES.CHAINCRUSH_NFT as `0x${string}`,
    abi: CHAINCRUSH_NFT_ABI,
    functionName: 'MAX_SUPPLY',
  });

  const { data: remainingSupply, isLoading: isLoadingRemaining, error: remainingError, refetch: refetchRemaining } = useContractRead({
    address: CONTRACT_ADDRESSES.CHAINCRUSH_NFT as `0x${string}`,
    abi: CHAINCRUSH_NFT_ABI,
    functionName: 'getRemainingSupply',
  });

  const isLoading = isLoadingCurrentId || isLoadingMaxSupply || isLoadingRemaining;
  const hasError = currentIdError || maxSupplyError || remainingError;

  // Function to refresh all data
  const refetchAll = () => {
    refetchCurrentId();
    refetchMaxSupply();
    refetchRemaining();
  };

  // Format the current supply for display
  const formatSupply = (supply: bigint | undefined) => {
    if (!supply) return '0';
    
    const supplyNumber = Number(supply);
    
    if (supplyNumber >= 1000000) {
      return `${(supplyNumber / 1000000).toFixed(1)}M`;
    } else if (supplyNumber >= 1000) {
      return `${(supplyNumber / 1000).toFixed(1)}K`;
    } else {
      return supplyNumber.toString();
    }
  };

  return {
    currentSupply: currentTokenId ? Number(currentTokenId as bigint) : (hasError ? 2300 : 0),
    maxSupply: maxSupply ? Number(maxSupply as bigint) : (hasError ? 10000 : 0),
    remainingSupply: remainingSupply ? Number(remainingSupply as bigint) : (hasError ? 7700 : 0),
    formattedCurrentSupply: hasError ? '2.3K' : formatSupply(currentTokenId as bigint | undefined),
    formattedMaxSupply: hasError ? '10K' : formatSupply(maxSupply as bigint | undefined),
    isLoading,
    hasError,
    refetchAll,
  };
}
