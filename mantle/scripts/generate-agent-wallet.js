// Script to generate AI Agent wallet for Ghost-Pay system
const { ethers } = require('ethers');
const fs = require('fs');

async function generateAgentWallet() {
    console.log('🔑 Generating AI Agent Wallet for Ghost-Pay...\n');
    
    // Generate a new random wallet
    const wallet = ethers.Wallet.createRandom();
    
    console.log('✅ Wallet Generated Successfully!');
    console.log('📋 Wallet Details:');
    console.log('Address:', wallet.address);
    console.log('Private Key:', wallet.privateKey);
    console.log('Mnemonic:', wallet.mnemonic.phrase);
    
    // Create environment file template
    const envTemplate = `# Ghost-Pay AI Agent Configuration
AGENT_PRIVATE_KEY=${wallet.privateKey}
AGENT_ADDRESS=${wallet.address}

# Mantle Network Configuration
MANTLE_RPC_URL=https://rpc.mantle.xyz
MANTLE_TESTNET_RPC_URL=https://rpc.testnet.mantle.xyz

# Contract Addresses (update after deployment)
GAME_REGISTRY_ADDRESS=
GHOST_SESSION_DELEGATE_ADDRESS=
`;

    // Save to .env.example file
    fs.writeFileSync('.env.example', envTemplate);
    console.log('\n📄 Environment template saved to .env.example');
    
    // Create backend integration example
    const backendExample = `// AI Agent Backend Integration Example
const { ethers } = require('ethers');

// Load from environment variables
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;
const AGENT_ADDRESS = process.env.AGENT_ADDRESS;

// Initialize wallet and provider
const provider = new ethers.providers.JsonRpcProvider(process.env.MANTLE_RPC_URL);
const agentWallet = new ethers.Wallet(AGENT_PRIVATE_KEY, provider);

// Example: Execute game action on behalf of player
async function executePlayerAction(playerEOA, gameRegistryAddress, actionData) {
    // The player's EOA has GhostSessionDelegate code via EIP-7702
    const playerContract = new ethers.Contract(
        playerEOA, 
        GhostSessionDelegateABI, 
        agentWallet
    );
    
    // Execute the game action
    const tx = await playerContract.executeGameAction(
        gameRegistryAddress,
        actionData
    );
    
    console.log('Transaction sent:', tx.hash);
    return tx;
}

module.exports = { agentWallet, executePlayerAction };
`;

    fs.writeFileSync('backend-integration-example.js', backendExample);
    console.log('📄 Backend integration example saved to backend-integration-example.js');
    
    console.log('\n⚠️  SECURITY WARNINGS:');
    console.log('1. 🔒 Keep the private key secure - never share it publicly');
    console.log('2. 💰 Fund this wallet with ETH for gas fees on Mantle network');
    console.log('3. 🔐 Use environment variables in production');
    console.log('4. 📊 Monitor this wallet for suspicious activity');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Copy the address above and update GhostSessionDelegate.sol');
    console.log('2. Fund the wallet with ETH for transaction gas');
    console.log('3. Deploy the contracts with the updated agent address');
    console.log('4. Integrate the private key into your backend service');
    
    return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase
    };
}

// Run the generator
if (require.main === module) {
    generateAgentWallet()
        .then(() => {
            console.log('\n✨ AI Agent wallet generation completed!');
        })
        .catch((error) => {
            console.error('❌ Error generating wallet:', error);
        });
}

module.exports = { generateAgentWallet };