# 🔥 Stranger Things Battle - Ghost-Pay DApp

A multiplayer cooperative battle game featuring the complete Stranger Things cast, showcasing **EIP-7702 Ghost-Pay** technology for seamless blockchain gaming with **Team Leader NFT** purchasing system.

## 🎮 **Game Overview**

Players purchase **Team Leader NFTs** to command squads of 4 Stranger Things heroes in strategic battles against Upside Down creatures. The game demonstrates how Ghost-Pay eliminates blockchain friction in gaming.

## 🏗️ **Architecture**

### **Smart Contracts (Mantle Sepolia)**
- **GameRegistry.sol** - Core game logic and rewards
- **GhostSessionDelegate.sol** - EIP-7702 delegation for seamless transactions  
- **TeamLeaderNFT.sol** - NFT system for team leadership purchasing

### **Backend Services**
- **Node.js/Express API** - Game state management and blockchain integration
- **WebSocket Server** - Real-time battle updates and communication
- **Ghost-Pay Integration** - Instant transaction processing via AI Agent

### **Frontend**
- **Next.js Web App** - Modern React-based gaming interface with TypeScript
- **Wagmi + RainbowKit** - Native Web3 integration for seamless MetaMask connectivity
- **Framer Motion** - Smooth animations and battle effects
- **Tailwind CSS** - Responsive design and modern styling

## 🚀 **Quick Start**

### **1. Deploy Contracts**
```bash
# Deploy TeamLeaderNFT (others already deployed)
npx hardhat run contracts/deploy-team-leader.js --network mantle-sepolia
```

### **2. Start Backend**
```bash
cd backend
npm install
# Backend runs on port 3001, WebSocket on 8081
node server.js
```

### **3. Run Frontend**
```bash
cd nextjs-dapp
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

## 👑 **Team Leader NFT System**

### **Purchase Process**
1. **Connect Wallet** - MetaMask integration with Mantle Sepolia
2. **Setup Ghost-Pay** - Sign EIP-7702 delegation for gasless transactions
3. **Browse Characters** - Choose from Stranger Things heroes (Eleven, Hopper, Steve, Dustin)
4. **Purchase NFT** - 0.01 MNT via Ghost-Pay (instant, no gas fees)
5. **Activate Leader** - Start commanding your squad immediately

### **Leadership Benefits**
- **Strategic Command** - Control all 4 team members
- **HP Management** - Use teammates' health as attack currency
- **Exclusive Access** - Only NFT holders can play as team leaders
- **Battle Statistics** - Track wins, damage, and performance
- **Tradeable Asset** - NFTs can be sold/transferred

## ⚔️ **Gameplay Mechanics**

### **Team Leadership**
- **Select Teammate** - Click any squad member to choose attacker
- **Command Attack** - Click enemies to order attacks (costs HP)
- **Resource Management** - Balance offense vs team survival
- **Strategic Decisions** - Choose attackers based on health/damage

### **Combat System**
- **Real-time Battles** - Face waves of Demogorgons and Vecna
- **Animated Effects** - Arrow projectiles, particle explosions, smooth animations
- **Power-ups** - Team coordination abilities and healing items (via Ghost-Pay)
- **Progressive Difficulty** - Enemies scale with battle rounds

## 🔧 **Technical Features**

### **Ghost-Pay Integration**
- **Instant Transactions** - No MetaMask popups during gameplay
- **Gas Sponsorship** - AI Agent covers all transaction costs
- **Seamless UX** - Continuous gaming without blockchain friction
- **EIP-7702 Implementation** - Temporary code delegation for smooth interactions

### **Real-time Architecture**
- **WebSocket Communication** - Live battle updates and coordination
- **Optimistic UI** - Immediate visual feedback with background settlement
- **State Synchronization** - Consistent game state across all players
- **Error Handling** - Graceful fallbacks for network issues

### **Modern Web3 Stack**
- **Next.js 16** - Latest React framework with TypeScript
- **Wagmi 2.19** - Type-safe Ethereum library
- **RainbowKit 2.2** - Best-in-class wallet connection
- **Framer Motion 12** - Production-ready animations

## 📊 **Business Model**

### **Revenue Streams**
- **NFT Sales** - 0.01 MNT per Team Leader NFT
- **Secondary Market** - Royalties on NFT trading
- **Premium Features** - Advanced battle modes and cosmetics
- **Tournament Entry** - Competitive events with entry fees

### **Scalability**
- **Multi-chain Deployment** - Easy expansion to other networks
- **Character Expansion** - Additional Stranger Things characters
- **Game Modes** - PvP battles, guild systems, seasonal events
- **Cross-game Integration** - NFTs usable in multiple games

## 🌐 **Deployment**

### **Live Demo**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:8081
- **Network**: Mantle Sepolia Testnet

### **Contract Addresses**
- **GameRegistry**: `0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A`
- **GhostSessionDelegate**: `0x2d84813B18a5d601A4ddc7153Ae44848Ff824D7A`
- **TeamLeaderNFT**: `0xE38449796438b6276AfcF9b3B32AA2F0B5247590`
- **AI Agent**: `0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081`

## 🎯 **Ghost-Pay Value Proposition**

### **Traditional Gaming Problems**
- ❌ MetaMask popups interrupt gameplay every action
- ❌ Gas fees create friction for microtransactions  
- ❌ Transaction delays break game flow
- ❌ Complex wallet management confuses users

### **Ghost-Pay Solutions**
- ✅ Instant actions with zero interruptions
- ✅ Gas-free experience for players
- ✅ Seamless blockchain integration
- ✅ Familiar gaming UX with Web3 benefits

## 🔮 **Future Roadmap**

### **Phase 1: Core Game** ✅
- Team Leader NFT system
- Strategic combat mechanics
- Ghost-Pay integration
- Real-time multiplayer
- Next.js migration complete

### **Phase 2: Expansion** 🚧
- PvP battle modes
- Guild systems and tournaments
- Character progression and items
- Mobile responsive optimization

### **Phase 3: Ecosystem** 📋
- Multi-game NFT utility
- Creator tools and modding
- Cross-chain deployment
- Mainstream adoption features

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Stranger Things** - Netflix for the amazing characters and universe
- **Mantle Network** - For providing the blockchain infrastructure
- **EIP-7702** - For enabling the Ghost-Pay delegation system
- **Next.js Team** - For the excellent React framework
- **Wagmi & RainbowKit** - For seamless Web3 integration

---

**Ready to lead the Stranger Things squad in the ultimate Ghost-Pay gaming experience? 👑⚡🔥**