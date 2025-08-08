// Simple rewards functions - placeholder implementation
export type RewardToken = "MON" | "USDC" | "ETH" | "CUSTOM";

export const rewardTypes: RewardToken[] = ["MON", "USDC", "ETH", "CUSTOM"];

export function getRandomValue(tokenType: RewardToken): number {
  const ranges = {
    MON: { min: 10, max: 100 },
    USDC: { min: 1, max: 10 },
    ETH: { min: 0.001, max: 0.01 },
    CUSTOM: { min: 1, max: 50 } // Adjust based on your token's value
  };
  const range = ranges[tokenType];
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

export function getTokenAddress(tokenType: RewardToken): string {
  const addresses = {
    MON: "0x0000000000000000000000000000000000000000",
    USDC: "0x0000000000000000000000000000000000000000",
    ETH: "0x0000000000000000000000000000000000000000",
    CUSTOM: process.env.NEXT_PUBLIC_CUSTOM_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000"
  };
  return addresses[tokenType];
}

export function getTokenDecimals(tokenType: RewardToken): number {
  const decimals = {
    MON: 18,
    USDC: 6,
    ETH: 18,
    CUSTOM: 18 // Most ERC20 tokens use 18 decimals
  };
  return decimals[tokenType];
}

export function getTokenImage(tokenType: RewardToken): string {
  const images = {
    MON: "🪙",
    USDC: "💵",
    ETH: "⚡",
    CUSTOM: "🎁" // Custom token icon
  };
  return images[tokenType];
}

export function getTokenName(tokenType: RewardToken): string {
  const names = {
    MON: "MON",
    USDC: "USDC",
    ETH: "ETH",
    CUSTOM: "MyRewardToken" // Your token name
  };
  return names[tokenType];
}

export function getTokenSymbol(tokenType: RewardToken): string {
  const symbols = {
    MON: "MON",
    USDC: "USDC",
    ETH: "ETH",
    CUSTOM: "MRT" // Your token symbol
  };
  return symbols[tokenType];
} 