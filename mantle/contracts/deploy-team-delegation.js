const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying TeamDelegation contract to Mantle Sepolia...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MNT\n");

  // Deploy TeamDelegation
  console.log("📦 Deploying TeamDelegation...");
  const TeamDelegation = await hre.ethers.getContractFactory("TeamDelegation");
  const teamDelegation = await TeamDelegation.deploy();
  
  await teamDelegation.waitForDeployment();
  const teamDelegationAddress = await teamDelegation.getAddress();
  
  console.log("✅ TeamDelegation deployed to:", teamDelegationAddress);
  console.log("\n🎉 Deployment complete!\n");
  
  console.log("📋 Contract Addresses:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TeamDelegation:", teamDelegationAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  console.log("📝 Add this to your .env file:");
  console.log(`TEAM_DELEGATION_ADDRESS=${teamDelegationAddress}`);
  console.log("\n✨ Ready to use for multiplayer battles!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
