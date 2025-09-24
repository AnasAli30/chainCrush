# Booster Shop Contract

This directory contains the smart contract and deployment scripts for the ChainCrush booster shop.

## Files

- `BoosterShop.sol` - Main smart contract for booster purchases
- `deploy-booster-shop.js` - Deployment script
- `BoosterShop.json` - Contract ABI and deployment info

## Setup

1. **Install Dependencies**
   ```bash
   npm install @openzeppelin/contracts hardhat
   ```

2. **Configure Environment**
   - Set up your `.env` file with your private key and RPC URL
   - Update the ARB token address in `deploy-booster-shop.js` if needed

3. **Deploy Contract**
   ```bash
   npx hardhat run deploy-booster-shop.js --network arbitrum
   ```

## Contract Features

- **Booster Types**: SHUFFLE (0) and PARTY_POPPER (1)
- **Pricing**: 0.1 ARB per booster (configurable)
- **ERC20 Support**: Uses ARB token for payments
- **Events**: Emits purchase events for frontend tracking
- **Ownership**: Owner can update prices and withdraw funds

## Frontend Integration

After deployment, update the contract address in:
- `components/Shop.tsx` - Update `BOOSTER_SHOP_ADDRESS`
- `lib/contracts/BoosterShop.json` - Update deployment info

## API Endpoints

- `POST /api/purchase-booster` - Handle booster purchases
- `GET /api/purchase-booster?fid=X` - Get user's booster inventory

## Database Schema

The contract events are processed by the API to update user booster counts in MongoDB:

```javascript
{
  fid: number,
  boosters: {
    shuffle: number,
    partyPopper: number
  },
  boosterTransactions: [
    {
      type: string,
      quantity: number,
      transactionHash: string,
      timestamp: Date
    }
  ]
}
```

## Security Notes

- Contract uses OpenZeppelin's ReentrancyGuard
- SafeERC20 for secure token transfers
- Owner-only functions for price updates
- Input validation for all parameters

## Testing

Test the contract on Arbitrum Sepolia testnet first:

1. Deploy to testnet
2. Test booster purchases
3. Verify API integration
4. Deploy to mainnet

## Gas Optimization

- Uses `nonReentrant` modifier efficiently
- Minimal storage operations
- Event emission for off-chain processing

