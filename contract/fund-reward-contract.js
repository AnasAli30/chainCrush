const { ethers } = require("hardhat");

async function main() {
  // Configuration - Update these values
  const CUSTOM_TOKEN_ADDRESS = process.env.CUSTOM_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
  const TOKEN_REWARD_ADDRESS = process.env.TOKEN_REWARD_ADDRESS || "0x0000000000000000000000000000000000000000";
  const FUND_AMOUNT = process.env.FUND_AMOUNT || "100000"; // Amount in token units (consider decimals)
  
  if (CUSTOM_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("Please set CUSTOM_TOKEN_ADDRESS environment variable");
    process.exit(1);
  }
  
  if (TOKEN_REWARD_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("Please set TOKEN_REWARD_ADDRESS environment variable");
    process.exit(1);
  }

  // Get the MyToken contract
  const MyToken = await ethers.getContractFactory("MyToken");
  const myToken = MyToken.attach(CUSTOM_TOKEN_ADDRESS);
  
  const [deployer] = await ethers.getSigners();
  
  console.log("Funding TokenReward contract with custom tokens...");
  console.log("Token Address:", CUSTOM_TOKEN_ADDRESS);
  console.log("TokenReward Address:", TOKEN_REWARD_ADDRESS);
  console.log("Fund Amount:", FUND_AMOUNT);
  console.log("Deployer Address:", deployer.address);
  
  // Check deployer's token balance
  const deployerBalance = await myToken.balanceOf(deployer.address);
  console.log("Deployer token balance:", ethers.utils.formatEther(deployerBalance));
  
  if (deployerBalance.lt(ethers.utils.parseEther(FUND_AMOUNT))) {
    console.error("Insufficient token balance to fund the contract");
    process.exit(1);
  }
  
  // Transfer tokens to TokenReward contract
  const tx = await myToken.transfer(TOKEN_REWARD_ADDRESS, ethers.utils.parseEther(FUND_AMOUNT));
  await tx.wait();
  
  console.log("✅ Successfully funded TokenReward contract!");
  console.log("Transaction hash:", tx.hash);
  
  // Check TokenReward contract's token balance
  const contractBalance = await myToken.balanceOf(TOKEN_REWARD_ADDRESS);
  console.log("TokenReward contract token balance:", ethers.utils.formatEther(contractBalance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 