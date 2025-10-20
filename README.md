# 🍬 ChainCrush - The Ultimate Web3 Candy Crush Game

[![Next.js](https://img.shields.io/badge/Next.js-14.2.6-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![Farcaster](https://img.shields.io/badge/Farcaster-MiniApp-purple?logo=farcaster)](https://farcaster.xyz/)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-orange?logo=solidity)](https://soliditylang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)](https://mongodb.com/)

> **The sweetest Web3 gaming experience on Farcaster!** Play, earn NFTs, compete on leaderboards, and win real crypto rewards in this fully-featured Candy Crush-style game built for the decentralized future.

## 🎮 What is ChainCrush?

ChainCrush is a revolutionary Web3 gaming platform that combines the addictive gameplay of Candy Crush with blockchain technology, NFT rewards, and crypto incentives. Built as a Farcaster Mini App, it offers players a seamless gaming experience while earning real value through gameplay.

### ✨ Key Features

- 🎯 **Addictive Gameplay**: Classic Candy Crush mechanics with Web3 twists
- 🎨 **NFT Rewards**: Mint unique NFTs based on your performance
- 🏆 **Competitive Leaderboards**: Dual scoring system with seasonal and all-time rankings
- 💰 **Crypto Rewards**: Earn tokens by burning rare NFTs
- 🛡️ **Security First**: Comprehensive anti-replay protection and signature verification
- 🎁 **Daily Rewards**: Faucet system and daily mint limits
- 📱 **Mobile Optimized**: Built for Farcaster Mini App ecosystem
- 🌙 **Theme Support**: Dark/Light mode with beautiful animations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- MongoDB database
- Ethereum wallet (for Web3 features)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/chaincrush.git
cd chaincrush

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start development server
pnpm dev
```

Visit `http://localhost:3000` to see your game in action!

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

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

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chaincrush

# Faucet Keys (Multi-key support)
SERVER_PRIVATE_KEY_1=your-first-faucet-key
SERVER_PRIVATE_KEY_2=your-second-faucet-key
SERVER_PRIVATE_KEY_3=your-third-faucet-key
SERVER_PRIVATE_KEY_4=your-fourth-faucet-key
SERVER_PRIVATE_KEY_5=your-fifth-faucet-key
```

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Game Engine**: Phaser.js 3.90
- **Blockchain**: Ethereum, Viem, Wagmi
- **Database**: MongoDB with Redis caching
- **Authentication**: Farcaster integration
- **Styling**: Tailwind CSS with Framer Motion animations
- **Icons**: FontAwesome

### Smart Contracts

#### ChainCrush NFT Contract
- **ERC-721** standard implementation
- **Daily mint limits** (6 per day)
- **Rarity system**: Common, Epic, Rare, Legendary
- **Signature verification** for secure minting
- **Score-based trait determination**

#### Token Reward Contract
- **Multi-token support** (MON, USDC, ETH, Custom tokens)
- **NFT burning mechanics** for token rewards
- **Signature-based reward distribution**
- **Owner-controlled token additions**

#### Booster Shop Contract
- **In-game item purchases** with ARB tokens
- **Shuffle and Party Popper boosters**
- **FID-based purchase tracking**

## 🎮 Game Features

### Core Gameplay
- **10x10 Grid**: Classic match-3 mechanics
- **Power-ups**: Shuffle, Party Popper, and special candies
- **Level Progression**: Increasing difficulty and rewards
- **Combo System**: Chain reactions and multipliers

### Scoring System
- **Current Season Score**: Updated every game for leaderboard rankings
- **All-Time High**: Tracks personal best scores
- **Performance Metrics**: Duration, level reached, combos achieved

### NFT System
- **Rarity Tiers**: 4 distinct rarity levels with different probabilities
- **Score-Based Minting**: Higher scores increase rare NFT chances
- **Daily Limits**: 6 mints per day per user
- **Metadata**: Rich NFT metadata with traits and rarity

### Reward System
- **Token Rewards**: Burn rare NFTs for crypto tokens
- **Faucet System**: Multi-key ETH faucet for new players
- **Leaderboard Prizes**: 200 ARB token prize pool
- **Daily Challenges**: Reset every 24 hours

## 🔐 Security Features

### Authentication Middleware
- **Replay Attack Prevention**: Unique keys for each request
- **Ethers.js Integration**: Consistent crypto operations
- **Edge Runtime Compatible**: Works with Next.js Edge Runtime
- **Dual Protection**: In-memory cache + database validation

### Smart Contract Security
- **Signature Verification**: All minting requires server signatures
- **Time-based Expiration**: 5-minute signature validity
- **Owner Controls**: Restricted admin functions
- **Reentrancy Protection**: Safe contract interactions

### Database Security
- **Input Validation**: Comprehensive data validation
- **Rate Limiting**: Built-in abuse prevention
- **Encrypted Storage**: Sensitive data protection
- **Audit Logging**: Complete transaction history

## 📊 API Endpoints

### Game Management
- `POST /api/submit-score` - Submit game scores
- `GET /api/leaderboard` - Get leaderboard data
- `GET /api/user-stats` - Get user statistics
- `GET /api/ath-leaderboard` - All-time high leaderboard

### NFT Operations
- `POST /api/mint-nft` - Mint NFTs with signatures
- `POST /api/burn-nft` - Burn NFTs for rewards
- `GET /api/check-nft-owner` - Check NFT ownership
- `GET /api/get-nft-trait` - Get NFT traits

### Faucet & Rewards
- `POST /api/faucet` - Claim ETH from faucet
- `GET /api/faucet-stats` - Get faucet statistics
- `POST /api/claim-gift-box` - Claim daily rewards
- `POST /api/mini-app-reward` - Mini app rewards

### Analytics & Monitoring
- `GET /api/total-players` - Total player count
- `GET /api/active-players` - Active player statistics
- `GET /api/nft-supply` - NFT supply information
- `GET /api/time` - Server time synchronization

## 🎯 Game Mechanics

### NFT Rarity System
```typescript
enum NFTTrait {
  Common = 0,    // 60% probability
  Epic = 1,      // 25% probability  
  Rare = 2,      // 12% probability
  Legendary = 3  // 3% probability
}
```

### Reward Distribution
- **Epic NFTs**: 1-10 tokens
- **Rare NFTs**: 5-25 tokens
- **Legendary NFTs**: 10-50 tokens

### Leaderboard Prizes (200 ARB Pool)
- **1st Place**: 10 ARB
- **2nd-3rd Place**: 10 ARB each
- **4th-10th Place**: 8 ARB each
- **11th-15th Place**: 5 ARB each

## 🛠️ Development

### Project Structure
```
chaincrush/
├── app/                    # Next.js app router
│   ├── api/               # API endpoints
│   └── page.tsx           # Main app page
├── components/            # React components
│   ├── Home/             # Game components
│   └── Leaderboard.tsx   # Leaderboard UI
├── contract/             # Smart contracts
│   ├── chaincrush.sol    # Main NFT contract
│   ├── BoosterShop.sol   # Shop contract
│   └── TokenReward.sol   # Reward contract
├── lib/                  # Utility libraries
│   ├── contracts.ts      # Contract ABIs
│   ├── database.ts       # Database operations
│   └── rewards.ts        # Reward logic
└── hooks/                # Custom React hooks
```

### Available Scripts
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run linter
```

### Database Schema
```typescript
// Game Scores
interface GameScore {
  fid: number;
  pfpUrl: string;
  username?: string;
  score: number;              // All-time high
  currentSeasonScore: number; // Current season
  level: number;
  userAddress: string;
  duration: number;
  timestamp: number;
  faucetClaimed: boolean;
}

// User Mints
interface UserMint {
  userAddress: string;
  score: number;
  tokenId: number;
  trait: NFTTrait;
  timestamp: number;
  transactionHash: string;
}
```

## 🚀 Deployment

### Production Deployment
1. **Deploy Smart Contracts**: Deploy to your target network
2. **Configure Environment**: Set production environment variables
3. **Database Setup**: Configure MongoDB Atlas
4. **Deploy Frontend**: Deploy to Vercel, Netlify, or your preferred platform
5. **Configure Domain**: Set up custom domain and SSL

### Farcaster Integration
1. **Mini App Setup**: Configure `farcaster.json`
2. **Frame Configuration**: Set up embed and splash screens
3. **Publishing**: Submit to Farcaster Mini App store
4. **Testing**: Use Warpcast embed tool for testing

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured for React/Next.js
- **Prettier**: Code formatting
- **Conventional Commits**: Standardized commit messages

## 📈 Roadmap

### Phase 1 (Current)
- ✅ Core gameplay mechanics
- ✅ NFT minting system
- ✅ Leaderboard functionality
- ✅ Reward distribution

### Phase 2 (Next)
- 🔄 Multi-player tournaments
- 🔄 Advanced power-ups
- 🔄 Seasonal events
- 🔄 Mobile app development

### Phase 3 (Future)
- 📅 Cross-chain support
- 📅 Governance token
- 📅 Staking rewards
- 📅 Creator marketplace

## 🐛 Troubleshooting

### Common Issues

**Build Errors**
- Ensure all environment variables are set
- Check Node.js version compatibility
- Clear `.next` cache and reinstall dependencies

**Database Connection**
- Verify MongoDB connection string
- Check network connectivity
- Ensure database permissions

**Smart Contract Issues**
- Verify contract addresses
- Check RPC endpoint connectivity
- Ensure sufficient gas fees

**Authentication Problems**
- Verify API secret keys match
- Check middleware configuration
- Clear browser cache

## 📞 Support

- **Documentation**: [Full Documentation](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/chaincrush/issues)
- **Discord**: [Community Server](https://discord.gg/chaincrush)
- **Twitter**: [@ChainCrushGame](https://twitter.com/chaincrushgame)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Farcaster Team** - For the amazing Mini App platform
- **Phaser.js Community** - For the excellent game engine
- **OpenZeppelin** - For secure smart contract libraries
- **Next.js Team** - For the powerful React framework

---

**Made with ❤️ for the Web3 gaming community**

*Play. Earn. Crush. Repeat.* 🍬