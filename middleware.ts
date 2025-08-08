import { NextRequest, NextResponse } from 'next/server';
import { keccak256, toUtf8Bytes } from 'ethers';

// Secret key (should be in environment variables in production)
const SECRET_KEY = process.env.API_SECRET_KEY || 'your-secret-key-here';

// In-memory storage for used keys (Edge Runtime compatible)
const usedKeys = new Set<string>();
const keyTimestamps = new Map<string, number>();

// Clean up old keys periodically
function cleanupOldKeys() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  keyTimestamps.forEach((timestamp, key) => {
    if (now - timestamp > maxAge) {
      usedKeys.delete(key);
      keyTimestamps.delete(key);
    }
  });
}

export function middleware(request: NextRequest) {
  // Only apply to POST requests
  if (request.method !== 'POST') {
    return NextResponse.next();
  }

  try {
    // Get the fused key and random string from headers
    const fusedKey = request.headers.get('x-fused-key');
    const randomString = request.headers.get('x-random-string');

    // Check if both headers are present
    if (!fusedKey || !randomString) {
      return NextResponse.json(
        { success: false, error: 'Missing authentication headers' },
        { status: 401 }
      );
    }

    // Check if this key has been used before (replay attack prevention)
    if (usedKeys.has(fusedKey)) {
      return NextResponse.json(
        { success: false, error: 'Authentication key already used' },
        { status: 401 }
      );
    }

    // Create expected fused key using ethers.js
    const expectedFusedKey = keccak256(
      toUtf8Bytes(SECRET_KEY + randomString)
    ).slice(2); // Remove '0x' prefix

    // Compare the provided fused key with the expected one
    if (fusedKey !== expectedFusedKey) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Store the used key to prevent replay attacks
    usedKeys.add(fusedKey);
    keyTimestamps.set(fusedKey, Date.now());

    // Clean up old keys periodically (every 100 requests or so)
    if (Math.random() < 0.01) {
      cleanupOldKeys();
    }

    // Authentication successful, proceed with the request
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware authentication error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};

