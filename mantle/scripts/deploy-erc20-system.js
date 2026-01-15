const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying ERC-20 Permission System...");
  console.log("");
  
  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Get balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MNT");
  console.log("");
  
  // Step 1: Deploy WMANTLE
  console.log("📦 Step 1: Deploying WMANTLE (Wrapped Mantle)...");
  const WMANTLE = await hre.ethers.getContractFactory("WMANTLE");
  const wmantle = await WMANTLE.deploy();
  await wmantle.waitForDeployment();
  const wmantleAddress = await wmantle.getAddress();
  console.log("✅ WMANTLE deployed to:", wmantleAddress);
  console.log("");
  
  // Step 2: Deploy ERC20Permissions
  console.log("📦 Step 2: Deploying ERC20Permissions contract...");
  const ERC20Permissions = await hre.ethers.getContractFactory("ERC20Permissions");
  const permissions = await ERC20Permissions.deploy(wmantleAddress);
  await permissions.waitForDeployment();
  const permissionsAddress = await permissions.getAddress();
  console.log("✅ ERC20Permissions deployed to:", permissionsAddress);
  console.log("");
  
  // Summary
  console.log("=" .repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=" .repeat(60));
  console.log("");
  console.log("📋 Contract Addresses:");
  console.log("  WMANTLE:", wmantleAddress);
  console.log("  ERC20Permissions:", permissionsAddress);
  console.log("");
  console.log("📋 Update your .env files:");
  console.log(`WMANTLE_ADDRESS=${wmantleAddress}`);
  console.log(`ERC20_PERMISSIONS_ADDRESS=${permissionsAddress}`);
  console.log("");
  console.log(`NEXT_PUBLIC_WMANTLE_ADDRESS=${wmantleAddress}`);
  console.log(`NEXT_PUBLIC_ERC20_PERMISSIONS_ADDRESS=${permissionsAddress}`);
  console.log("");
  console.log("🔗 View on explorer:");
  console.log(`WMANTLE: https://explorer.sepolia.mantle.xyz/address/${wmantleAddress}`);
  console.log(`ERC20Permissions: https://explorer.sepolia.mantle.xyz/address/${permissionsAddress}`);
  console.log("");
  console.log("=" .repeat(60));
  console.log("📖 HOW IT WORKS:");
  console.log("=" .repeat(60));
  console.log("");
  console.log("1. Player wraps MNT → WMANTLE:");
  console.log("   WMANTLE.deposit{value: 0.1 ether}()");
  console.log("");
  console.log("2. Player approves contract:");
  console.log("   WMANTLE.approve(ERC20Permissions, 0.1 ether)");
  console.log("");
  console.log("3. Player grants permission:");
  console.log("   ERC20Permissions.grantPermission(backend, 0.1 ether, 86400)");
  console.log("");
  console.log("4. Weapon vote passes → Backend executes:");
  console.log("   ERC20Permissions.executeTeamAction([player1, player2], [0.003, 0.003])");
  console.log("");
  console.log("5. Contract pulls WMANTLE from players' wallets automatically!");
  console.log("");
  console.log("✅ Money stays in wallet until weapon is used!");
  console.log("✅ No signature needed per weapon!");
  console.log("✅ Spending cap enforced!");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
