export const MESSAGE_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30; // 30 day

const APP_URL = process.env.NEXT_PUBLIC_URL;

if (!APP_URL) {
  throw new Error('NEXT_PUBLIC_URL or NEXT_PUBLIC_VERCEL_URL is not set');
}

// Blockchain configuration
export const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc';
export const BOOSTER_SHOP_ADDRESS = '0x31c72c62aD07f50a51660F39f601ffdA16B427B3';
export const CRSH_TOKEN_ADDRESS = '0xe461003E78A7bF4F14F0D30b3ac490701980aB07';

export { APP_URL };
