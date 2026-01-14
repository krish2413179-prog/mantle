// Enhanced deployment script for Ghost-Pay contracts on Mantle Sepolia
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying Ghost-Pay contracts to Mantle Sepolia...\n");
    
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("📡 Network:", network.name, "| Chain ID:", network.chainId);
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    const balance = await ethers.provider.getBalance(deployerAddress);
    
    console.log("👤 Deploying with account:", deployerAddress);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
    
    if (balance < ethers.parseEther("0.01")) {
        console.log("⚠️  WARNING: Low balance! You may need more ETH for deployment.");
        console.log("💡 Get testnet ETH from: https://faucet.sepolia.mantle.xyz/");
    }

    console.log("\n" + "=".repeat(50));

    // Deploy GameRegistry contract
    console.log("📋 1. Deploying GameRegistry...");
    const GameRegistry = await ethers.getContractFactory("GameRegistry");
    
    console.log("   ⏳ Estimating gas...");
    
    // Get current gas price from network
    const feeData = await ethers.provider.getFeeData();
    console.log("   💰 Network gas price:", ethers.formatUnits(feeData.gasPrice, "gwei"), "gwei");
    
    console.log("   ⏳ Sending deployment transaction...");
    const gameRegistry = await GameRegistry.deploy();
    
    console.log("   ⏳ Waiting for confirmation...");
    await gameRegistry.waitForDeployment();
    const gameRegistryAddress = await gameRegistry.getAddress();
    
    console.log("   ✅ GameRegistry deployed!");
    console.log("   📍 Address:", gameRegistryAddress);

    // Deploy GhostSessionDelegate contract
    console.log("\n📋 2. Deploying GhostSessionDelegate...");
    const GhostSessionDelegate = await ethers.getContractFactory("GhostSessionDelegate");
    
    console.log("   ⏳ Sending deployment transaction...");
    const ghostSessionDelegate = await GhostSessionDelegate.deploy();
    
    console.log("   ⏳ Waiting for confirmation...");
    await ghostSessionDelegate.waitForDeployment();
    const ghostSessionDelegateAddress = await ghostSessionDelegate.getAddress();
    
    console.log("   ✅ GhostSessionDelegate deployed!");
    console.log("   📍 Address:", ghostSessionDelegateAddress);

    console.log("\n" + "=".repeat(50));

    // Verify deployments with test calls
    console.log("🔍 3. Verifying deployments...\n");
    
    try {
        // Test GameRegistry
        console.log("   Testing GameRegistry...");
        const playerStats = await gameRegistry.getPlayerStats(deployerAddress);
        console.log("   ✅ GameRegistry working - Initial stats:", {
            gold: playerStats[0].toString(),
            experience: playerStats[1].toString(),
            level: playerStats[2].toString()
        });

        // Test GhostSessionDelegate
        console.log("   Testing GhostSessionDelegate...");
        const authorizedAgent = await ghostSessionDelegate.getAuthorizedAgent();
        const isSessionValid = await ghostSessionDelegate.isSessionValid();
        console.log("   ✅ GhostSessionDelegate working");
        console.log("   🤖 Authorized agent:", authorizedAgent);
        console.log("   📅 Session valid:", isSessionValid);

    } catch (error) {
        console.log("   ⚠️  Verification error:", error.message);
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!\n");

    // Summary
    console.log("📋 CONTRACT ADDRESSES:");
    console.log("┌─────────────────────────┬──────────────────────────────────────────────┐");
    console.log("│ Contract                │ Address                                      │");
    console.log("├─────────────────────────┼──────────────────────────────────────────────┤");
    console.log(`│ GameRegistry            │ ${gameRegistryAddress} │`);
    console.log(`│ GhostSessionDelegate    │ ${ghostSessionDelegateAddress} │`);
    console.log("└─────────────────────────┴──────────────────────────────────────────────┘");

    // Explorer links
    console.log("\n🔍 EXPLORER LINKS:");
    console.log(`GameRegistry: https://explorer.sepolia.mantle.xyz/address/${gameRegistryAddress}`);
    console.log(`GhostSessionDelegate: https://explorer.sepolia.mantle.xyz/address/${ghostSessionDelegateAddress}`);

    // Next steps
    console.log("\n📝 NEXT STEPS:");
    console.log("1. ✅ AI Agent address is already configured!");
    console.log("   Address:", await ghostSessionDelegate.getAuthorizedAgent());
    console.log("   Run: node scripts/generate-agent-wallet.js");
    
    console.log("\n2. 💰 Fund your AI Agent wallet with testnet ETH");
    console.log("   Faucet: https://faucet.sepolia.mantle.xyz/");
    
    console.log("\n3. 🔍 Verify contracts on explorer (optional):");
    console.log(`   npx hardhat verify --network mantle-sepolia ${gameRegistryAddress}`);
    console.log(`   npx hardhat verify --network mantle-sepolia ${ghostSessionDelegateAddress}`);
    
    console.log("\n4. 🔧 Integrate with your Flutter SDK:");
    console.log("   - Use the contract addresses above");
    console.log("   - Configure your AI Agent backend");
    console.log("   - Test the EIP-7702 delegation flow");

    // Save deployment info
    const deploymentInfo = {
        network: "mantle-sepolia",
        chainId: network.chainId,
        deployer: deployerAddress,
        timestamp: new Date().toISOString(),
        contracts: {
            GameRegistry: gameRegistryAddress,
            GhostSessionDelegate: ghostSessionDelegateAddress
        },
        explorerUrls: {
            GameRegistry: `https://explorer.sepolia.mantle.xyz/address/${gameRegistryAddress}`,
            GhostSessionDelegate: `https://explorer.sepolia.mantle.xyz/address/${ghostSessionDelegateAddress}`
        }
    };

    // Write deployment info to file
    const fs = require('fs');
    fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to deployment-info.json");

    return deploymentInfo;
}

// Handle deployment
main()
    .then((info) => {
        console.log("\n✨ All contracts deployed successfully to Mantle Sepolia!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });