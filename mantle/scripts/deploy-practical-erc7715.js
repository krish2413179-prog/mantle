const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying PracticalERC7715 contract...");
  
  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Get balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MNT");
  
  // Deploy contract
  const PracticalERC7715 = await hre.ethers.getContractFactory("PracticalERC7715");
  const contract = await PracticalERC7715.deploy();
  
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  
  console.log("✅ PracticalERC7715 deployed to:", address);
  console.log("");
  console.log("📋 Update your .env files with:");
  console.log(`PRACTICAL_ERC7715_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_PRACTICAL_ERC7715_ADDRESS=${address}`);
  console.log("");
  console.log("🔗 View on explorer:");
  console.log(`https://explorer.sepolia.mantle.xyz/address/${address}`);
  console.log("");
  console.log("✅ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
