# 🚀 Stranger Things Battle - Deployment Guide

## 📋 **Project Structure**

```
mantle/
├── contracts/                 # Smart contracts
│   ├── GameRegistry.sol      # Core game logic
│   ├── GhostSessionDelegate.sol # EIP-7702 delegation
│   ├── TeamLeaderNFT.sol     # NFT system
│   └── deploy-team-leader.js # Deployment script
├── backend/                   # Node.js backend
│   ├── server.js             # Express + WebSocket server
│   └── .env                  # Environment configuration
├── nextjs-dapp/              # Next.js frontend
│   ├── src/app/              # App router pages
│   ├── src/components/       # React components
│   └── src/lib/              # Web3 configuration
└── scripts/                   # Utility scripts
```

## 🔧 **Prerequisites**

- **Node.js** 18+ and npm
- **MetaMask** browser extension
- **Mantle Sepolia** testnet MNT tokens

## 🚀 **Deployment Steps**

### **1. Smart Contracts**

```bash
# Install dependencies
npm install

# Deploy TeamLeaderNFT (others already deployed)
npx hardhat run contracts/deploy-team-leader.js --network mantle-sepolia
```

**Deployed Addresses:**
- GameRegistry: `0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A`
- GhostSessionDelegate: `0x2d84813B18a5d601A4ddc7153Ae44848Ff824D7A`
- TeamLeaderNFT: `0xE38449796438b6276AfcF9b3B32AA2F0B5247590`

### **2. Backend Server**

```bash
cd backend
npm install

# Start server (port 3001, WebSocket 8081)
node server.js
```

### **3. Frontend Application**

```bash
cd nextjs-dapp
npm install

# Start development server (port 3000)
npm run dev
```

## 🌐 **Access Points**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:8081

## 🎮 **Usage Flow**

1. **Connect Wallet** - MetaMask with Mantle Sepolia
2. **Setup Ghost-Pay** - Sign EIP-7702 delegation
3. **Purchase Team Leader** - Buy NFT (0.01 MNT)
4. **Start Battle** - Command your squad in combat

## 🔍 **Verification**

### **Smart Contracts**
- Verify on [Mantle Sepolia Explorer](https://sepolia.mantlescan.xyz)
- Check contract interactions and events

### **Backend Health**
```bash
curl http://localhost:3001/health
```

### **Frontend**
- Open http://localhost:3000
- Check browser console for errors
- Test MetaMask connection

## 🛠️ **Troubleshooting**

### **Common Issues**

**MetaMask Connection**
- Ensure Mantle Sepolia network is added
- Check wallet has sufficient MNT balance
- Clear browser cache if needed

**Backend Errors**
- Verify environment variables in `backend/.env`
- Check contract addresses are correct
- Ensure RPC endpoint is accessible

**Frontend Issues**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check browser console for detailed errors

## 📊 **Monitoring**

### **Backend Logs**
- Server startup messages
- WebSocket connections
- Transaction processing

### **Frontend Console**
- Web3 connection status
- Ghost-Pay setup progress
- Battle system events

## 🔐 **Security Notes**

- Private keys are stored securely in environment variables
- EIP-7702 delegation is temporary and revocable
- Smart contracts are verified and auditable
- No sensitive data stored in frontend

## 🎯 **Production Deployment**

### **Backend**
- Use PM2 or similar process manager
- Configure reverse proxy (nginx)
- Set up SSL certificates
- Monitor with logging service

### **Frontend**
- Build production bundle: `npm run build`
- Deploy to Vercel, Netlify, or similar
- Configure environment variables
- Set up domain and SSL

### **Smart Contracts**
- Deploy to Mantle mainnet
- Verify contracts on explorer
- Set up monitoring and alerts
- Configure multi-sig for admin functions

---

**The Stranger Things Battle DApp is now fully deployed and operational! 🎮✨**