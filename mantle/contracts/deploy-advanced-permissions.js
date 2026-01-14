const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying AdvancedPermissions contract to Mantle Sepolia...");
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Get balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MNT");
  
  // Deploy contract
  const AdvancedPermissions = await hre.ethers.getContractFactory("AdvancedPermissions");
  const contract = await AdvancedPermissions.deploy();
  
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  
  console.log("✅ AdvancedPermissions deployed to:", address);
  console.log("🔗 View on explorer: https://explorer.sepolia.mantle.xyz/address/" + address);
  console.log("");
  console.log("📋 Update your .env.local file:");
  console.log(`NEXT_PUBLIC_ADVANCED_PERMISSIONS_ADDRESS=${address}`);
  console.log("");
  console.log("🎉 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
