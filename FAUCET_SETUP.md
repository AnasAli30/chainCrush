# 🚰 Multi-Key Faucet Setup Guide

## Overview
The faucet system now supports 5 private keys for load balancing and redundancy. This provides better traffic management and fault tolerance.

## Environment Variables Setup

Add these environment variables to your `.env.local` file:

```bash
# Faucet Private Keys (at least one required)
SERVER_PRIVATE_KEY_1=your_first_private_key_here
SERVER_PRIVATE_KEY_2=your_second_private_key_here
SERVER_PRIVATE_KEY_3=your_third_private_key_here
SERVER_PRIVATE_KEY_4=your_fourth_private_key_here
SERVER_PRIVATE_KEY_5=your_fifth_private_key_here

# RPC URL for blockchain interaction
RPC_URL=https://sepolia.infura.io/v3/your-project-id
```

## How It Works

### 🔄 Load Balancing Strategy
1. **Random Selection**: Randomly picks one of the 5 available wallets
2. **Fast Response**: No balance checking before selection for faster response times
3. **Natural Distribution**: Traffic naturally distributes across all wallets over time

### 📊 Monitoring
- **Wallet Usage Tracking**: Each transaction records which wallet was used
- **Statistics API**: `/api/faucet-stats` provides usage statistics
- **Logging**: Console logs show which wallet is being used for each transaction

### 🛡️ Security Features
- **Multiple Keys**: Reduces single point of failure
- **Balance Validation**: Ensures sufficient funds before transaction
- **Error Handling**: Graceful fallback if one wallet fails
- **Authentication**: All requests still require valid auth headers

## API Endpoints

### POST `/api/faucet`
- **Purpose**: Claim faucet ETH
- **Authentication**: Required (fused key headers)
- **Response**: Transaction hash and wallet used

### GET `/api/faucet-stats`
- **Purpose**: Get wallet usage statistics
- **Authentication**: Required (fused key headers)
- **Response**: Usage stats for all wallets

## Database Schema

### FaucetClaim Collection
```typescript
{
  userAddress: string,
  amount: string,
  transactionHash: string,
  timestamp: number,
  blockNumber: number,
  walletIndex: number  // 1-5 indicating which wallet was used
}
```

## Benefits

✅ **Load Distribution**: Traffic spread across multiple wallets
✅ **Redundancy**: System continues if one wallet is empty
✅ **Monitoring**: Track usage patterns and balance distribution
✅ **Scalability**: Easy to add more wallets in the future
✅ **Fault Tolerance**: Automatic fallback to available wallets

## Best Practices

1. **Fund All Wallets**: Keep all 5 wallets funded for optimal distribution
2. **Monitor Balances**: Regularly check wallet balances
3. **Rotate Keys**: Consider rotating private keys periodically
4. **Backup Keys**: Securely store private keys with proper backups
5. **Monitor Usage**: Use the stats API to track wallet performance

## Troubleshooting

### "All faucet wallets have insufficient balance"
- Check all wallet balances
- Fund the wallets that are empty
- Verify RPC URL is correct

### "At least one SERVER_PRIVATE_KEY must be set"
- Ensure at least one private key is set in environment variables
- Check for typos in variable names

### Wallet selection issues
- Check console logs for wallet selection details
- Verify all private keys are valid
- Ensure RPC provider is responsive
