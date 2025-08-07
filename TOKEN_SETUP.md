# Custom Token Reward Setup Guide

This guide will help you deploy your own ERC20 token and integrate it as a reward in the ChainCrush game.

## Overview

The ChainCrush system allows players to:
1. Play the game and earn NFTs based on their score
2. Burn Epic, Rare, or Legendary NFTs to receive token rewards
3. Your custom token can be one of the reward options

## Step 1: Deploy Your Token

### 1.1 Install Dependencies
```bash
npm install @openzeppelin/contracts
```

### 1.2 Deploy Your Token
```bash
# Set your environment variables
export CUSTOM_TOKEN_ADDRESS="your_token_address_after_deployment"
export TOKEN_REWARD_ADDRESS="your_token_reward_contract_address"

# Deploy the token
npx hardhat run contract/deploy-token.js --network <your_network>
```

The deployment script will create a token with:
- Name: "MyRewardToken"
- Symbol: "MRT"
- Initial Supply: 1,000,000 tokens
- Owner: Your deployer address

## Step 2: Add Token to Reward System

### 2.1 Add Token to Supported Tokens
```bash
# Set environment variables
export CUSTOM_TOKEN_ADDRESS="your_deployed_token_address"
export TOKEN_REWARD_ADDRESS="your_token_reward_contract_address"

# Add token to supported tokens list
npx hardhat run contract/add-token-to-rewards.js --network <your_network>
```

### 2.2 Fund the Reward Contract
```bash
# Set the amount you want to fund (in token units)
export FUND_AMOUNT="100000"

# Fund the contract
npx hardhat run contract/fund-reward-contract.js --network <your_network>
```

## Step 3: Update Environment Variables

Add these to your `.env` file:
```env
NEXT_PUBLIC_CUSTOM_TOKEN_ADDRESS=your_deployed_token_address
CUSTOM_TOKEN_ADDRESS=your_deployed_token_address
TOKEN_REWARD_ADDRESS=your_token_reward_contract_address
```

## Step 4: Configure Reward Amounts

Update the reward ranges in `lib/rewards.ts`:
```typescript
CUSTOM: { min: 1, max: 50 } // Adjust based on your token's value
```

## How the System Works

### NFT Minting
1. Player pays 0.01 ETH to mint an NFT
2. NFT rarity is determined by game score and randomness
3. Higher scores increase chances of better traits

### NFT Burning for Rewards
1. Player burns Epic, Rare, or Legendary NFTs
2. Backend generates a signature for the reward
3. Player receives tokens based on NFT rarity

### Reward Distribution
- **Epic NFTs**: 1-10 tokens
- **Rare NFTs**: 5-25 tokens  
- **Legendary NFTs**: 10-50 tokens

## Security Features

1. **Signature Verification**: All rewards require server signatures
2. **One-time Use**: Each signature can only be used once
3. **Owner Controls**: Only contract owner can add supported tokens
4. **Time Limits**: Signatures expire after 5 minutes

## Testing Your Setup

1. Deploy your token
2. Add it to supported tokens
3. Fund the reward contract
4. Test the reward flow:
   - Mint an NFT
   - Burn it for your token reward
   - Verify the tokens are received

## Troubleshooting

### Common Issues

1. **"Token not supported"**: Make sure you've added your token to supported tokens
2. **"Insufficient balance"**: Fund the TokenReward contract with your tokens
3. **"Invalid signature"**: Check your server private key configuration
4. **"Signature expired"**: Generate new signatures within 5 minutes

### Environment Variables Checklist

- [ ] `CUSTOM_TOKEN_ADDRESS` - Your deployed token address
- [ ] `TOKEN_REWARD_ADDRESS` - TokenReward contract address
- [ ] `SERVER_PRIVATE_KEY` - Server's private key for signatures
- [ ] `NEXT_PUBLIC_CUSTOM_TOKEN_ADDRESS` - Public token address for frontend

## Customization Options

### Token Parameters
- **Name**: Change in `deploy-token.js`
- **Symbol**: Change in `deploy-token.js`
- **Initial Supply**: Adjust in `deploy-token.js`
- **Decimals**: Most ERC20 tokens use 18 decimals

### Reward Ranges
- **Epic**: 1-10 tokens (adjust in backend)
- **Rare**: 5-25 tokens (adjust in backend)
- **Legendary**: 10-50 tokens (adjust in backend)

### Token Icon
- Update the emoji in `lib/rewards.ts` for the `CUSTOM` token

## Next Steps

After setting up your token:

1. **Test the complete flow** with small amounts
2. **Monitor the contract balance** and refill as needed
3. **Adjust reward amounts** based on your token's value
4. **Consider adding more tokens** to the supported list
5. **Implement analytics** to track reward distribution

## Support

If you encounter issues:
1. Check the contract addresses are correct
2. Verify environment variables are set
3. Ensure sufficient token balance in the reward contract
4. Check network configuration matches your deployment 