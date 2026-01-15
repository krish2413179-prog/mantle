# Render Backend Deployment Guide

## Current Deployment
- **URL**: https://mantle-o8d5.onrender.com
- **Service**: Web Service
- **Region**: Auto

## Step-by-Step Deployment Process

### Step 1: Sign Up / Login to Render
1. Go to https://render.com
2. Click "Get Started" or "Sign In"
3. Choose "Sign in with GitHub"
4. Authorize Render to access your repositories

### Step 2: Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `krish2413179-prog/mantle`
3. Click "Connect"

### Step 3: Configure Service Settings
- **Name**: `mantle-backend` (or any name you prefer)
- **Region**: Oregon (US West) or closest to you
- **Branch**: `envio`
- **Root Directory**: `backend`
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Instance Type**: Free (or paid for better performance)

### Step 4: Add Environment Variables

Click "Advanced" → "Add Environment Variable" and add these:

```bash
# Blockchain Configuration
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz

# Agent Private Key (IMPORTANT: Use your backend wallet private key)
AGENT_PRIVATE_KEY=0x020e83d7deacfc9d40a7ff4d09867ab543f527686770cfde44d3a44dabdadb66

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

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait 3-5 minutes for deployment
3. Your backend will be live!

## Environment Variables Explained

### Required Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `MANTLE_RPC_URL` | `https://rpc.sepolia.mantle.xyz` | Mantle Sepolia RPC endpoint |
| `AGENT_PRIVATE_KEY` | `0x020e83d7...` | Backend wallet private key (pays gas fees) |
| `GAME_REGISTRY_ADDRESS` | `0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A` | Game registry contract |
| `GHOST_DELEGATE_ADDRESS` | `0x2d84813B18a5d601A4ddc7153Ae44848Ff824D7A` | Ghost delegation contract |
| `TEAM_LEADER_NFT_ADDRESS` | `0xE38449796438b6276AfcF9b3B32AA2F0B5247590` | Team leader NFT contract |
| `TEAM_DELEGATION_ADDRESS` | `0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4` | Team delegation contract |
| `WMANTLE_ADDRESS` | `0x157695Bd2966FBC0EE8440a7D60D9F8993AE7850` | WMANTLE token contract |
| `GAME_PAYMENT_ADDRESS` | `0xD2c30a46Ac468F67f7C2eb7Bd60bf33b6Cfb388b` | Game payment contract |
| `PORT` | `3001` | Server port (Render uses 10000 by default) |
| `NODE_ENV` | `production` | Environment mode |

### ⚠️ Security Note
- **NEVER** commit `AGENT_PRIVATE_KEY` to GitHub
- Keep it only in Render environment variables
- This wallet pays all gas fees for players

## Copy-Paste Format for Render

```
MANTLE_RPC_URL
https://rpc.sepolia.mantle.xyz

AGENT_PRIVATE_KEY
0x020e83d7deacfc9d40a7ff4d09867ab543f527686770cfde44d3a44dabdadb66

GAME_REGISTRY_ADDRESS
0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A

GHOST_DELEGATE_ADDRESS
0x2d84813B18a5d601A4ddc7153Ae44848Ff824D7A

TEAM_LEADER_NFT_ADDRESS
0xE38449796438b6276AfcF9b3B32AA2F0B5247590

TEAM_DELEGATION_ADDRESS
0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4

WMANTLE_ADDRESS
0x157695Bd2966FBC0EE8440a7D60D9F8993AE7850

GAME_PAYMENT_ADDRESS
0xD2c30a46Ac468F67f7C2eb7Bd60bf33b6Cfb388b

PORT
3001

NODE_ENV
production
```

## Testing Your Deployment

### 1. Check Backend Health
Visit: `https://your-service.onrender.com`

You should see:
```
Stranger Things Battle Backend is running!
```

### 2. Check WebSocket
Open browser console and test:
```javascript
const ws = new WebSocket('wss://your-service.onrender.com');
ws.onopen = () => console.log('Connected!');
```

### 3. Test API Endpoints
```bash
# Health check
curl https://your-service.onrender.com

# Get rooms
curl https://your-service.onrender.com/api/rooms
```

## Common Issues & Solutions

### Issue 1: "Module not found"
**Solution**: Make sure Root Directory is set to `backend`

### Issue 2: "Cannot connect to blockchain"
**Solution**: 
- Check `MANTLE_RPC_URL` is correct
- Verify `AGENT_PRIVATE_KEY` is valid

### Issue 3: "Port already in use"
**Solution**: Render automatically assigns port, ignore this locally

### Issue 4: WebSocket not working
**Solution**: 
- Render automatically supports WebSocket
- Make sure frontend uses `wss://` not `ws://`

### Issue 5: "Insufficient funds for gas"
**Solution**: 
- Fund the backend wallet with MNT
- Address: Get from private key
- Get testnet MNT from Mantle faucet

## Updating Your Backend

### Option 1: Automatic (Recommended)
1. Push code to GitHub
```bash
git add .
git commit -m "Update backend"
git push origin envio
```
2. Render automatically rebuilds
3. Wait 3-5 minutes

### Option 2: Manual
1. Go to Render dashboard
2. Click your service
3. Click "Manual Deploy" → "Deploy latest commit"

## Monitoring

### Logs
- Go to your service dashboard
- Click "Logs" tab
- See real-time server logs

### Metrics
- CPU usage
- Memory usage
- Request count
- Response times

## Scaling (Paid Plans)

### Free Tier Limitations
- Spins down after 15 minutes of inactivity
- Takes 30-60 seconds to wake up
- 750 hours/month free

### Paid Tier Benefits
- Always on (no spin down)
- Faster performance
- More memory/CPU
- Custom domains

## Backend Wallet Management

### Check Balance
```bash
# Get wallet address from private key
# Fund with testnet MNT from faucet
```

### Faucet Links
- Mantle Sepolia Faucet: https://faucet.sepolia.mantle.xyz
- Bridge: https://bridge.sepolia.mantle.xyz

## Production Checklist
- ✅ Root directory set to `backend`
- ✅ All environment variables added
- ✅ `AGENT_PRIVATE_KEY` kept secret
- ✅ Backend wallet funded with MNT
- ✅ Build succeeds without errors
- ✅ WebSocket connections work
- ✅ API endpoints respond
- ✅ Blockchain transactions execute

## Support
- Render Docs: https://render.com/docs
- Mantle Docs: https://docs.mantle.xyz
- Your Service: https://mantle-o8d5.onrender.com

## Quick Reference

### Your URLs
- **Backend API**: https://mantle-o8d5.onrender.com
- **WebSocket**: wss://mantle-o8d5.onrender.com
- **GitHub**: https://github.com/krish2413179-prog/mantle
- **Branch**: envio

### Key Files
- `backend/server.js` - Main server file
- `backend/package.json` - Dependencies
- `backend/.env` - Local environment (not committed)
