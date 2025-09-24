export const MESSAGE_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30; // 30 day

const APP_URL = process.env.NEXT_PUBLIC_URL;

if (!APP_URL) {
  throw new Error('NEXT_PUBLIC_URL or NEXT_PUBLIC_VERCEL_URL is not set');
}

// Blockchain configuration
export const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc';
export const BOOSTER_SHOP_ADDRESS = '0x3F095701677F65F09E19B48e620f47EE725d3558';
export const ARB_TOKEN_ADDRESS = '0x912CE59144191C1204E64559FE8253a0e49E6548';

export { APP_URL };
