# Environment Variables Setup

To prevent build errors, set up these environment variables in your `.env.local` file:

## Required Environment Variables

```bash
# API Authentication
API_SECRET_KEY=your-super-secret-key-change-this-in-production
NEXT_PUBLIC_API_SECRET_KEY=your-super-secret-key-change-this-in-production

# Server Private Key (for signing transactions)
SERVER_PRIVATE_KEY=your-server-private-key

# Contract Addresses
CHAINCRUSH_NFT_ADDRESS=0x0000000000000000000000000000000000000000
TOKEN_REWARD_ADDRESS=0x0000000000000000000000000000000000000000

# Public Contract Addresses
NEXT_PUBLIC_CHAINCRUSH_NFT_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_TOKEN_REWARD_ADDRESS=0x0000000000000000000000000000000000000000

# RPC URL
RPC_URL=https://your-rpc-endpoint

# Daily Mint Limit
DAILY_MINT_LIMIT=6

# Custom Token Address (optional)
NEXT_PUBLIC_CUSTOM_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000

# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/chaincrush?retryWrites=true&w=majority

# Redis Configuration (optional)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

## Development Setup

For development, you can use placeholder values:

```bash
# .env.local
API_SECRET_KEY=dev-secret-key-123
NEXT_PUBLIC_API_SECRET_KEY=dev-secret-key-123
SERVER_PRIVATE_KEY=0x1234567890123456789012345678901234567890123456789012345678901234
CHAINCRUSH_NFT_ADDRESS=0x0000000000000000000000000000000000000000
TOKEN_REWARD_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_CHAINCRUSH_NFT_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_TOKEN_REWARD_ADDRESS=0x0000000000000000000000000000000000000000
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
DAILY_MINT_LIMIT=6
```

## Production Setup

For production, replace with actual contract addresses and secure keys:

```bash
# .env.local (Production)
API_SECRET_KEY=your-actual-secret-key
NEXT_PUBLIC_API_SECRET_KEY=your-actual-secret-key
SERVER_PRIVATE_KEY=your-actual-server-private-key
CHAINCRUSH_NFT_ADDRESS=0xYourActualNFTContractAddress
TOKEN_REWARD_ADDRESS=0xYourActualTokenRewardAddress
NEXT_PUBLIC_CHAINCRUSH_NFT_ADDRESS=0xYourActualNFTContractAddress
NEXT_PUBLIC_TOKEN_REWARD_ADDRESS=0xYourActualTokenRewardAddress
RPC_URL=https://your-production-rpc-endpoint
DAILY_MINT_LIMIT=6
```

## Notes

- The application now provides default values for most environment variables to prevent build errors
- `SERVER_PRIVATE_KEY` is still required for signing transactions
- Contract addresses can be set to zero addresses for development
- Make sure to use actual contract addresses in production
