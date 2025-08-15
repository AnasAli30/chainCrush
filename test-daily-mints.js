// Test script for daily mint functionality
const testDailyMints = async () => {
  console.log('Testing daily mint functionality...');
  
  const testUserAddress = '0x1234567890abcdef1234567890abcdef12345678';
  
  // Test 1: Check if user has minted today (should be false initially)
  console.log('\n1. Checking initial mint status...');
  try {
    const response1 = await fetch(`http://localhost:3000/api/user-stats?userAddress=${testUserAddress}`);
    const result1 = await response1.json();
    console.log('User stats:', result1.data);
    console.log('Has minted today:', result1.data.hasMintedToday);
  } catch (error) {
    console.error('Error checking user stats:', error);
  }
  
  // Test 2: Simulate a mint (this would normally be done through the game)
  console.log('\n2. Simulating a mint...');
  try {
    const response2 = await fetch('http://localhost:3000/api/mint-nft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAddress: testUserAddress,
        score: 1500
      })
    });
    const result2 = await response2.json();
    console.log('Mint result:', result2);
  } catch (error) {
    console.error('Error minting NFT:', error);
  }
  
  // Test 3: Check if user has minted today (should be true now)
  console.log('\n3. Checking mint status after minting...');
  try {
    const response3 = await fetch(`http://localhost:3000/api/user-stats?userAddress=${testUserAddress}`);
    const result3 = await response3.json();
    console.log('User stats after mint:', result3.data);
    console.log('Has minted today:', result3.data.hasMintedToday);
  } catch (error) {
    console.error('Error checking user stats:', error);
  }
  
  // Test 4: Check leaderboard (user should now be visible)
  console.log('\n4. Checking leaderboard...');
  try {
    const response4 = await fetch('http://localhost:3000/api/game-leaderboard?limit=10');
    const result4 = await response4.json();
    console.log('Leaderboard result:', result4.data);
    console.log('Total players:', result4.data.total);
  } catch (error) {
    console.error('Error checking leaderboard:', error);
  }
  
  console.log('\nTest completed!');
};

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  testDailyMints().catch(console.error);
}
