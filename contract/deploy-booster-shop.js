const { ethers } = require("hardhat");

async function main() {
  console.log("Starting BoosterShop deployment...");

  // ARB token address on Arbitrum (mainnet)
  // You might want to use a testnet address for testing
  const ARB_TOKEN_ADDRESS = "0x912CE59144191C1204E64559FE8253a0e49E6548"; // Arbitrum mainnet ARB
  
  // For testnet, you might use:
  // const ARB_TOKEN_ADDRESS = "0x..."; // Testnet ARB address

  console.log("ARB Token Address:", ARB_TOKEN_ADDRESS);

  // Get the contract factory
  const BoosterShop = await ethers.getContractFactory("BoosterShop");

  // Deploy the contract
  console.log("Deploying BoosterShop...");
  const boosterShop = await BoosterShop.deploy(ARB_TOKEN_ADDRESS);

  // Wait for deployment to complete
  await boosterShop.deployed();

  console.log("✅ BoosterShop deployed to:", boosterShop.address);
  console.log("Transaction hash:", boosterShop.deployTransaction.hash);

  // Verify deployment
  console.log("\n📋 Contract Information:");
  console.log("Contract Address:", boosterShop.address);
  console.log("ARB Token Address:", await boosterShop.arbToken());
  console.log("Shuffle Price:", ethers.utils.formatEther(await boosterShop.getBoosterPrice(0)) + " ARB");
  console.log("Party Popper Price:", ethers.utils.formatEther(await boosterShop.getBoosterPrice(1)) + " ARB");

  // Save contract address to a file for frontend use
  const fs = require('fs');
  const contractInfo = {
    address: boosterShop.address,
    arbToken: ARB_TOKEN_ADDRESS,
    network: "arbitrum", // or "arbitrum-sepolia" for testnet
    deploymentTime: new Date().toISOString()
  };

  fs.writeFileSync(
    './contract/BoosterShop.json',
    JSON.stringify(contractInfo, null, 2)
  );

  console.log("\n💾 Contract info saved to ./contract/BoosterShop.json");

  console.log("\n🔧 Next Steps:");
  console.log("1. Verify the contract on Arbiscan (optional)");
  console.log("2. Update frontend with contract address:", boosterShop.address);
  console.log("3. Test the contract with small amounts first");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

