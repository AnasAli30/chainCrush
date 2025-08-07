const { ethers } = require("hardhat");

async function main() {
  // Get the contract factory
  const MyToken = await ethers.getContractFactory("MyToken");
  
  // Deploy the token with your desired parameters
  const tokenName = "MyRewardToken";
  const tokenSymbol = "MRT";
  const initialSupply = 1000000; // 1 million tokens
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying MyToken with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  
  const myToken = await MyToken.deploy(
    tokenName,
    tokenSymbol,
    initialSupply,
    deployer.address
  );
  
  await myToken.deployed();
  
  console.log("MyToken deployed to:", myToken.address);
  console.log("Token Name:", tokenName);
  console.log("Token Symbol:", tokenSymbol);
  console.log("Initial Supply:", initialSupply);
  console.log("Owner:", deployer.address);
  
  // Save deployment info
  const deploymentInfo = {
    tokenAddress: myToken.address,
    tokenName: tokenName,
    tokenSymbol: tokenSymbol,
    initialSupply: initialSupply,
    owner: deployer.address,
    network: (await ethers.provider.getNetwork()).name
  };
  
  console.log("\nDeployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 