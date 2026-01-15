const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SimpleGamePayment contract...\n");

  // WMANTLE address on Mantle Sepolia
  const WMANTLE_ADDRESS = "0x157695Bd2966FBC0EE8440a7D60D9F8993AE7850";

  // Deploy SimpleGamePayment
  const SimpleGamePayment = await hre.ethers.getContractFactory("SimpleGamePayment");
  const gamePayment = await SimpleGamePayment.deploy(WMANTLE_ADDRESS);
  await gamePayment.waitForDeployment();

  const gamePaymentAddress = await gamePayment.getAddress();

  console.log("✅ SimpleGamePayment deployed to:", gamePaymentAddress);
  console.log("📝 WMANTLE address:", WMANTLE_ADDRESS);
  console.log("\n📋 Summary:");
  console.log("=".repeat(50));
  console.log("WMANTLE:", WMANTLE_ADDRESS);
  console.log("SimpleGamePayment:", gamePaymentAddress);
  console.log("=".repeat(50));
  
  console.log("\n🔧 Update these in your .env files:");
  console.log(`WMANTLE_ADDRESS=${WMANTLE_ADDRESS}`);
  console.log(`GAME_PAYMENT_ADDRESS=${gamePaymentAddress}`);
  
  console.log("\n✨ Players need to:");
  console.log("1. Wrap MNT → WMANTLE (one-time)");
  console.log("2. Approve contract to spend WMANTLE (one-time)");
  console.log("3. Play - WMANTLE deducted automatically!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
