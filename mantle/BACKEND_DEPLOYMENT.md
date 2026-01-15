# Backend Deployment Configuration

## Production Backend URL
- **Backend API**: https://mantle-o8d5.onrender.com
- **WebSocket**: wss://mantle-o8d5.onrender.com

## Environment Variables

### Frontend (.env.local)
```bash
# Backend Agent URL (Render deployment)
NEXT_PUBLIC_BACKEND_URL=https://mantle-o8d5.onrender.com
NEXT_PUBLIC_WS_URL=wss://mantle-o8d5.onrender.com

# Contract Addresses (Mantle Sepolia)
NEXT_PUBLIC_TEAM_DELEGATION_ADDRESS=0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4
NEXT_PUBLIC_GAME_REGISTRY_ADDRESS=0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A
NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_ADVANCED_PERMISSIONS_ADDRESS=0x48652Af3CeD9C41eB1F826e075330B758917B05B

# WMANTLE Game Currency System
NEXT_PUBLIC_WMANTLE_ADDRESS=0x157695Bd2966FBC0EE8440a7D60D9F8993AE7850
NEXT_PUBLIC_GAME_PAYMENT_ADDRESS=0xD2c30a46Ac468F67f7C2eb7Bd60bf33b6Cfb388b
```

### Backend (.env)
```bash
# Blockchain Configuration
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
AGENT_PRIVATE_KEY=<YOUR_PRIVATE_KEY>

# Contract Addresses (Mantle Sepolia)
GAME_REGISTRY_ADDRESS=0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A
GHOST_DELEGATE_ADDRESS=0x2d84813B18a5d601A4ddc7153Ae44848Ff824D7A
TEAM_LEADER_NFT_ADDRESS=0xE38449796438b6276AfcF9b3B32AA2F0B5247590
TEAM_DELEGATION_ADDRESS=0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4

# WMANTLE Game Currency System
WMANTLE_ADDRESS=0x157695Bd2966FBC0EE8440a7D60D9F8993AE7850
GAME_PAYMENT_ADDRESS=0xD2c30a46Ac468F67f7C2eb7Bd60bf33b6Cfb388b

# Server Configuration
PORT=3001
NODE_ENV=production
```

## Deployment Platform
- **Platform**: Render.com
- **Service**: Web Service
- **Region**: Auto
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && node server.js`

## Features
- ✅ Gasless transactions (backend pays gas fees)
- ✅ Real-time WebSocket connections
- ✅ WMANTLE game currency system
- ✅ Democratic voting system
- ✅ 5-round battle progression
- ✅ Solo and multiplayer modes
