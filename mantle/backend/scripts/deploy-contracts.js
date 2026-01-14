const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log('🚀 Deploying Team Leader NFT Contract...');
    
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(process.env.MANTLE_RPC_URL);
    const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);
    
    console.log('📡 Network: Mantle Sepolia');
    console.log('👤 Deploying with account:', wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('💰 Account balance:', ethers.formatEther(balance), 'MNT');
    
    if (balance < ethers.parseEther('0.1')) {
        throw new Error('Insufficient balance for deployment');
    }
    
    // Contract bytecode and ABI (you'll need to compile the Solidity contract)
    const contractFactory = new ethers.ContractFactory(
        teamLeaderNFTABI,
        teamLeaderNFTBytecode,
        wallet
    );
    
    // Deploy contract
    console.log('📋 Deploying TeamLeaderNFT...');
    const contract = await contractFactory.deploy();
    
    console.log('⏳ Waiting for deployment confirmation...');
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    console.log('✅ TeamLeaderNFT deployed to:', contractAddress);
    
    // Update .env file
    console.log('\n📝 Add this to your .env file:');
    console.log(`TEAM_LEADER_NFT_ADDRESS=${contractAddress}`);
    
    // Verify deployment
    console.log('\n🔍 Verifying deployment...');
    const totalSupply = await contract.totalSupply();
    console.log('📊 Initial total supply:', totalSupply.toString());
    
    console.log('\n🎉 Deployment completed successfully!');
    
    return {
        contractAddress,
        transactionHash: contract.deploymentTransaction().hash
    };
}

// Contract ABI and Bytecode (simplified - you'll need the full compiled contract)
const teamLeaderNFTABI = [
    "constructor()",
    "function purchaseLeader(string memory characterName) external payable",
    "function activateLeader(uint256 tokenId) external",
    "function getActiveLeader(address owner) external view returns (uint256)",
    "function totalSupply() external view returns (uint256)"
];

// Note: You'll need to compile the Solidity contract to get the actual bytecode
const teamLeaderNFTBytecode = "0x608060405234801561001057600080fd5b50..."; // Full bytecode here

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('❌ Deployment failed:', error);
            process.exit(1);
        });
}

module.exports = { main };