// Deployment script for Ghost-Pay contracts
// This script deploys both GameRegistry and GhostSessionDelegate contracts

const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying Ghost-Pay contracts...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy GameRegistry contract
    console.log("\n1. Deploying GameRegistry...");
    const GameRegistry = await ethers.getContractFactory("GameRegistry");
    const gameRegistry = await GameRegistry.deploy();
    await gameRegistry.deployed();
    console.log("GameRegistry deployed to:", gameRegistry.address);

    // Deploy GhostSessionDelegate contract
    console.log("\n2. Deploying GhostSessionDelegate...");
    const GhostSessionDelegate = await ethers.getContractFactory("GhostSessionDelegate");
    const ghostSessionDelegate = await GhostSessionDelegate.deploy();
    await ghostSessionDelegate.deployed();
    console.log("GhostSessionDelegate deployed to:", ghostSessionDelegate.address);

    // Verify deployment
    console.log("\n3. Verifying deployments...");
    
    // Test GameRegistry
    const playerStats = await gameRegistry.getPlayerStats(deployer.address);
    console.log("GameRegistry test - Initial player stats:", {
        gold: playerStats.gold.toString(),
        experience: playerStats.experience.toString(),
        level: playerStats.level.toString()
    });

    // Test GhostSessionDelegate
    const agentAddress = await ghostSessionDelegate.getAuthorizedAgent();
    console.log("GhostSessionDelegate test - Authorized agent:", agentAddress);

    console.log("\n✅ Deployment completed successfully!");
    console.log("\n📋 Contract Addresses:");
    console.log("GameRegistry:", gameRegistry.address);
    console.log("GhostSessionDelegate:", ghostSessionDelegate.address);
    
    console.log("\n⚠️  IMPORTANT: Update the AGENT_ADDRESS in GhostSessionDelegate.sol");
    console.log("Current placeholder:", agentAddress);
    console.log("Replace with your actual AI Agent's wallet address before production use.");

    return {
        gameRegistry: gameRegistry.address,
        ghostSessionDelegate: ghostSessionDelegate.address
    };
}

// Handle deployment errors
main()
    .then((addresses) => {
        console.log("\n🎉 All contracts deployed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    });