// Setup script to help with deployment preparation
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function setupDeployment() {
    console.log("🚀 Ghost-Pay Deployment Setup\n");
    
    console.log("📋 You need a deployer wallet with ETH on Mantle Sepolia to deploy contracts.");
    console.log("💡 If you don't have one, create a new MetaMask account and get testnet ETH.\n");
    
    console.log("🔗 Useful Links:");
    console.log("   • Mantle Sepolia Faucet: https://faucet.sepolia.mantle.xyz/");
    console.log("   • Mantle Sepolia Explorer: https://explorer.sepolia.mantle.xyz/");
    console.log("   • Add Mantle Sepolia to MetaMask: https://docs.mantle.xyz/network/for-devs/network-info\n");
    
    const hasWallet = await askQuestion("Do you have a wallet with Mantle Sepolia ETH? (y/n): ");
    
    if (hasWallet.toLowerCase() !== 'y') {
        console.log("\n📝 Steps to get ready:");
        console.log("1. Create a new MetaMask account (or use existing)");
        console.log("2. Add Mantle Sepolia network to MetaMask:");
        console.log("   - Network Name: Mantle Sepolia Testnet");
        console.log("   - RPC URL: https://rpc.sepolia.mantle.xyz");
        console.log("   - Chain ID: 5003");
        console.log("   - Currency Symbol: MNT");
        console.log("   - Block Explorer: https://explorer.sepolia.mantle.xyz/");
        console.log("3. Get testnet ETH from: https://faucet.sepolia.mantle.xyz/");
        console.log("4. Come back and run this script again!");
        rl.close();
        return;
    }
    
    console.log("\n🔑 Now I need your deployer wallet's private key.");
    console.log("⚠️  This will be stored in .env file - keep it secure!");
    console.log("💡 To get private key from MetaMask:");
    console.log("   1. Click on your account");
    console.log("   2. Go to Account Details");
    console.log("   3. Click 'Export Private Key'");
    console.log("   4. Enter your password");
    console.log("   5. Copy the private key\n");
    
    const privateKey = await askQuestion("Enter your deployer private key (starts with 0x): ");
    
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
        console.log("❌ Invalid private key format. Should start with 0x and be 64 characters long.");
        rl.close();
        return;
    }
    
    // Update .env file
    let envContent = fs.readFileSync('.env', 'utf8');
    envContent = envContent.replace('PRIVATE_KEY=YOUR_DEPLOYER_PRIVATE_KEY_HERE', `PRIVATE_KEY=${privateKey}`);
    fs.writeFileSync('.env', envContent);
    
    console.log("\n✅ Configuration updated!");
    console.log("🚀 Ready to deploy! Run: npm run deploy:sepolia");
    
    const deployNow = await askQuestion("\nDeploy contracts now? (y/n): ");
    
    if (deployNow.toLowerCase() === 'y') {
        rl.close();
        console.log("\n🚀 Starting deployment...\n");
        
        // Run deployment
        const { spawn } = require('child_process');
        const deployProcess = spawn('npm', ['run', 'deploy:sepolia'], { 
            stdio: 'inherit',
            shell: true 
        });
        
        deployProcess.on('close', (code) => {
            if (code === 0) {
                console.log("\n🎉 Deployment completed successfully!");
            } else {
                console.log("\n❌ Deployment failed. Check the error messages above.");
            }
        });
    } else {
        console.log("\n💡 When ready, run: npm run deploy:sepolia");
        rl.close();
    }
}

setupDeployment().catch(console.error);