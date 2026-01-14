// Deployment script for TeamLeaderNFT contract
const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying TeamLeaderNFT contract...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contract with account:", deployer.address);
    console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

    // Deploy TeamLeaderNFT contract
    console.log("\n1. Deploying TeamLeaderNFT...");
    const TeamLeaderNFT = await ethers.getContractFactory("TeamLeaderNFT");
    const teamLeaderNFT = await TeamLeaderNFT.deploy();
    await teamLeaderNFT.waitForDeployment();
    const teamLeaderAddress = await teamLeaderNFT.getAddress();
    console.log("TeamLeaderNFT deployed to:", teamLeaderAddress);

    // Verify deployment
    console.log("\n2. Verifying deployment...");
    
    const name = await teamLeaderNFT.name();
    const symbol = await teamLeaderNFT.symbol();
    const leaderPrice = await teamLeaderNFT.LEADER_PRICE();
    const maxLeaders = await teamLeaderNFT.MAX_LEADERS();
    
    console.log("Contract verification:");
    console.log("- Name:", name);
    console.log("- Symbol:", symbol);
    console.log("- Leader Price:", ethers.formatEther(leaderPrice), "MNT");
    console.log("- Max Leaders:", maxLeaders.toString());

    console.log("\n✅ TeamLeaderNFT deployment completed successfully!");
    console.log("\n📋 Contract Address:");
    console.log("TeamLeaderNFT:", teamLeaderAddress);
    
    console.log("\n🔧 Next steps:");
    console.log("1. Update backend/.env with TEAM_LEADER_NFT_ADDRESS");
    console.log("2. Update nextjs-dapp/src/lib/web3.ts with the new address");

    return teamLeaderAddress;
}

// Handle deployment errors
main()
    .then((address) => {
        console.log("\n🎉 TeamLeaderNFT deployed successfully to:", address);
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    });