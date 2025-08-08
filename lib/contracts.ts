// Contract addresses and ABIs for ChainCrush NFT system

export const CONTRACT_ADDRESSES = {
  CHAINCRUSH_NFT: process.env.NEXT_PUBLIC_CHAINCRUSH_NFT_ADDRESS || "0x880712866c174E8c90e0Bb9B4B5F1c58236B7c0A",
  TOKEN_REWARD: process.env.NEXT_PUBLIC_TOKEN_REWARD_ADDRESS || "0x14a4495E209A62F25CCe7ec32097E103490a6179",
};

export const CHAINCRUSH_NFT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "symbol", "type": "string" },
      { "internalType": "string", "name": "baseTokenURI", "type": "string" },
      { "internalType": "address", "name": "signerAddress", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "score", "type": "uint256" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "internalType": "bytes", "name": "signature", "type": "bytes" }
    ],
    "name": "mintNFT",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "burnNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "getTokenTrait",
    "outputs": [{ "internalType": "enum ChainCrush.Trait", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "enum ChainCrush.Trait", "name": "trait", "type": "uint8" }
    ],
    "name": "getUserNFTsByTrait",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentTokenId",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRemainingSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentDay",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "canMintToday",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getRemainingMintsToday",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "uint256", "name": "day", "type": "uint256" }
    ],
    "name": "dailyMints",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_SUPPLY",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "DAILY_MINT_LIMIT",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

export const TOKEN_REWARD_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "address", "name": "rewardToken", "type": "address" },
      { "internalType": "uint256", "name": "rewardAmount", "type": "uint256" },
      { "internalType": "bytes", "name": "signature", "type": "bytes" }
    ],
    "name": "burnNFTForReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getUserBurnableNFTs",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getAllNFTsByAddress",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  }
];

export enum NFTTrait {
  Common = 0,
  Epic = 1,
  Rare = 2,
  Legendary = 3
}

export const TRAIT_NAMES = {
  [NFTTrait.Common]: "Common",
  [NFTTrait.Epic]: "Epic",
  [NFTTrait.Rare]: "Rare",
  [NFTTrait.Legendary]: "Legendary"
};

export const TRAIT_COLORS = {
  [NFTTrait.Common]: "#6B7280",
  [NFTTrait.Epic]: "#8B5CF6",
  [NFTTrait.Rare]: "#F59E0B",
  [NFTTrait.Legendary]: "#EF4444"
};

 