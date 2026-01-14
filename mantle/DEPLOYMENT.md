# 🚀 Ghost-Pay Contract Deployment Guide

This guide will help you deploy the Ghost-Pay contracts to Mantle Sepolia testnet.

## 📋 Prerequisites

### 1. Wallet Setup
- **MetaMask** or another Ethereum wallet
- **Mantle Sepolia testnet** added to your wallet
- **Testnet ETH** for gas fees

### 2. Add Mantle Sepolia to MetaMask
```
Network Name: Mantle Sepolia Testnet
RPC URL: https://rpc.sepolia.mantle.xyz
Chain ID: 5003
Currency Symbol: MNT
Block Explorer: https://explorer.sepolia.mantle.xyz/
```

### 3. Get Testnet ETH
Visit the [Mantle Sepolia Faucet](https://faucet.sepolia.mantle.xyz/) and request testnet ETH.

## 🛠️ Deployment Steps

### Option 1: Interactive Setup (Recommended)
```bash
node scripts/setup-deployment.js
```
This script will:
- Guide you through the setup process
- Help you configure your private key
- Deploy the contracts automatically

### Option 2: Manual Setup

1. **Configure Environment**
   ```bash
   cp .env.example .env
   ```

2. **Add Your Private Key**
   Edit `.env` and replace `YOUR_DEPLOYER_PRIVATE_KEY_HERE` with your actual private key:
   ```
   PRIVATE_KEY=0x1234567890abcdef...
   ```

3. **Deploy Contracts**
   ```bash
   npm run deploy:sepolia
   ```

## 📊 What Gets Deployed

### 1. GameRegistry Contract
- Manages player stats, items, and rewards
- Standard game logic without EIP-7702 knowledge
- Emits events for monitoring

### 2. GhostSessionDelegate Contract
- EIP-7702 delegation logic
- AI Agent authorization
- Session management with spending limits
- **Pre-configured with AI Agent address**: `0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081`

## 🔍 Verification

After deployment, you'll get:
- **Contract addresses** for both contracts
- **Explorer links** to view on Mantle Sepolia
- **Deployment info** saved to `deployment-info.json`

### Verify Contracts (Optional)
```bash
npx hardhat verify --network mantle-sepolia <CONTRACT_ADDRESS>
```

## 🔧 Integration

### Contract Addresses
After deployment, use these addresses in your Flutter SDK:

```dart
// Example integration
const gameRegistryAddress = "0x..."; // From deployment output
const ghostSessionDelegateAddress = "0x..."; // From deployment output

await ghostPaySDK.initialize(
  gameRegistryAddress: gameRegistryAddress,
  delegateAddress: ghostSessionDelegateAddress,
);
```

### AI Agent Backend
Your AI Agent wallet is already configured:
- **Address**: `0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081`
- **Private Key**: Available in `.env` file
- **Fund this wallet** with testnet ETH for transaction gas

## 🔒 Security Notes

### Private Key Security
- ✅ Store private keys in environment variables
- ✅ Never commit `.env` to git
- ✅ Use different wallets for testnet and mainnet
- ✅ Monitor wallet activity

### AI Agent Security
- The AI Agent address is hardcoded in the contract
- Only this specific address can execute delegated actions
- Fund the AI Agent wallet with minimal ETH needed for gas

## 🐛 Troubleshooting

### Common Issues

1. **"Insufficient funds for gas"**
   - Get more testnet ETH from the faucet
   - Check you're on Mantle Sepolia network

2. **"Invalid private key"**
   - Ensure private key starts with `0x`
   - Check the key is 64 characters long (66 with 0x)

3. **"Network connection failed"**
   - Check your internet connection
   - Verify RPC URL is correct

### Getting Help
- Check the [Mantle Documentation](https://docs.mantle.xyz/)
- View transactions on [Mantle Sepolia Explorer](https://explorer.sepolia.mantle.xyz/)
- Ensure you have the latest Node.js version

## 📈 Next Steps

After successful deployment:

1. **Test the contracts** with sample transactions
2. **Integrate with Flutter SDK** using the contract addresses
3. **Configure your AI Agent backend** with the provided wallet
4. **Test EIP-7702 delegation flow** end-to-end
5. **Monitor contract events** for system health

## 🎯 Production Deployment

For mainnet deployment:
1. Use a secure wallet with real ETH
2. Audit contracts thoroughly
3. Test extensively on testnet first
4. Use hardware wallets for production keys
5. Set up monitoring and alerting

```bash
# When ready for mainnet
npm run deploy:mainnet
```