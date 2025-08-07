# ChainCrush Backend Setup

## MongoDB Configuration

### 1. Install MongoDB Dependencies
```bash
npm install mongodb
```

### 2. Environment Variables
Add these to your `.env.local` file:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/chaincrush

# Blockchain Configuration
SERVER_PRIVATE_KEY=your_private_key_here
CHAINCRUSH_NFT_ADDRESS=0x...
TOKEN_REWARD_ADDRESS=0x...

# Daily Mint Limit (optional, defaults to 5)
DAILY_MINT_LIMIT=5

# Next.js Configuration
NEXT_PUBLIC_CHAINCRUSH_NFT_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_REWARD_ADDRESS=0x...
```

### 3. MongoDB Setup Options

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use `mongodb://localhost:27017/chaincrush`

#### Option B: MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Replace `MONGODB_URI` with your Atlas connection string

### 4. Database Collections

The backend automatically creates these collections:
- `userMints` - Stores all NFT mint records
- `dailyMints` - Tracks daily mint counts per user

### 5. API Endpoints

#### `/api/mint-nft` (POST)
- Checks daily mint limits
- Generates signatures for NFT minting
- Saves mint records to database

#### `/api/user-stats` (GET)
- Returns user statistics
- Daily mint count
- Mint history
- Top scores

#### `/api/leaderboard` (GET)
- Returns top scores
- Total mints
- Today's mints

### 6. Features

✅ **Daily Mint Limits** - Backend enforces 5 mints per day per user
✅ **User Tracking** - All mints are stored with user address and score
✅ **Statistics** - Real-time stats and leaderboards
✅ **Signature Security** - Server-signed messages for blockchain transactions
✅ **Rate Limiting** - Prevents abuse through database checks

### 7. Testing

Test the backend by:
1. Playing the game
2. Trying to mint an NFT
3. Checking your stats
4. Viewing the leaderboard

The backend will automatically handle all the daily limit logic that was removed from the smart contract! 