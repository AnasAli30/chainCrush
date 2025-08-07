const { ethers } = require("hardhat");

async function main() {
  // Configuration - Update these values
  const TOKEN_REWARD_ADDRESS = process.env.TOKEN_REWARD_ADDRESS || "0x0000000000000000000000000000000000000000";
  const CUSTOM_TOKEN_ADDRESS = process.env.CUSTOM_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
  
  if (TOKEN_REWARD_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("Please set TOKEN_REWARD_ADDRESS environment variable");
    process.exit(1);
  }
  
  if (CUSTOM_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("Please set CUSTOM_TOKEN_ADDRESS environment variable");
    process.exit(1);
  }

  // Get the TokenReward contract
  const TokenReward = await ethers.getContractFactory("TokenReward");
  const tokenReward = TokenReward.attach(TOKEN_REWARD_ADDRESS);
  
  const [deployer] = await ethers.getSigners();
  
  console.log("Adding custom token to TokenReward contract...");
  console.log("TokenReward Address:", TOKEN_REWARD_ADDRESS);
  console.log("Custom Token Address:", CUSTOM_TOKEN_ADDRESS);
  console.log("Deployer Address:", deployer.address);
  
  // Add the custom token to supported tokens
  const tx = await tokenReward.setSupportedToken(CUSTOM_TOKEN_ADDRESS, true);
  await tx.wait();
  
  console.log("✅ Custom token successfully added to supported tokens!");
  console.log("Transaction hash:", tx.hash);
  
  // Verify the token was added
  const isSupported = await tokenReward.supportedTokens(CUSTOM_TOKEN_ADDRESS);
  console.log("Token supported:", isSupported);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 