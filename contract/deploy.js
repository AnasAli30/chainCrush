const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy ChainCrush NFT contract
  const ChainCrush = await ethers.getContractFactory("ChainCrush");
  const chainCrush = await ChainCrush.deploy(
    "ChainCrush NFT",
    "CCRUSH",
    "https://api.chaincrush.com/metadata/",
    deployer.address // Signer address
  );
  await chainCrush.waitForDeployment();
  console.log("ChainCrush NFT deployed to:", await chainCrush.getAddress());

  // Deploy TokenReward contract
  const TokenReward = await ethers.getContractFactory("TokenReward");
  const tokenReward = await TokenReward.deploy(
    deployer.address, // Server signer
    await chainCrush.getAddress() // ChainCrush NFT address
  );
  await tokenReward.waitForDeployment();
  console.log("TokenReward deployed to:", await tokenReward.getAddress());

  // Set up supported tokens (example with USDC and MON)
  // You'll need to replace these with actual token addresses
  const USDC_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace with actual USDC address
  const MON_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace with actual MON address

  await tokenReward.setSupportedToken(USDC_ADDRESS, true);
  await tokenReward.setSupportedToken(MON_ADDRESS, true);
  console.log("Supported tokens configured");

  console.log("Deployment completed!");
  console.log("ChainCrush NFT:", await chainCrush.getAddress());
  console.log("TokenReward:", await tokenReward.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 