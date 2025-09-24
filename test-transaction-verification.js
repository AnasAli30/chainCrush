// Test script for transaction verification
// Run with: node test-transaction-verification.js

const { verifyTransaction, checkDuplicateTransaction } = require('./lib/blockchain-verification.ts');

async function testTransactionVerification() {
  console.log('Testing transaction verification...');
  
  // Test with a sample transaction hash (replace with real hash for testing)
  const testTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const testFid = 12345;
  const testBoosterType = 0; // Shuffle
  const testQuantity = 2;
  
  try {
    const result = await verifyTransaction(testTxHash, testFid, testBoosterType, testQuantity);
    console.log('Verification result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Verification error:', error);
  }
}

// Uncomment to run test
// testTransactionVerification();

