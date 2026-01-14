# 🎮 Frontend Setup Guide

Your backend agent is now deployed at: **https://mantle-o8d5.onrender.com**

## ✅ What's Been Updated

All frontend files have been updated to use your deployed backend:
- API calls now use `https://mantle-o8d5.onrender.com`
- WebSocket connections now use `wss://mantle-o8d5.onrender.com`
- Environment variables configured in `.env.local`

## 🚀 How to Run the Frontend Locally

### Step 1: Navigate to Frontend Directory
```bash
cd nextjs-dapp
```

### Step 2: Install Dependencies (if not already done)
```bash
npm install
```

### Step 3: Start the Development Server
```bash
npm run dev
```

### Step 4: Open in Browser
Visit: http://localhost:3000

## 🎯 What Works Now

✅ **Backend runs 24/7 on Render** (no laptop needed)
✅ **Frontend connects to deployed backend**
✅ **All API calls go to Render**
✅ **WebSocket connections work**
✅ **Blockchain transactions processed by agent**

## 🔧 Environment Variables

Your `.env.local` file contains:
```bash
NEXT_PUBLIC_BACKEND_URL=https://mantle-o8d5.onrender.com
NEXT_PUBLIC_WS_URL=wss://mantle-o8d5.onrender.com
NEXT_PUBLIC_TEAM_DELEGATION_ADDRESS=0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4
NEXT_PUBLIC_GAME_REGISTRY_ADDRESS=0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A
NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_ADVANCED_PERMISSIONS_ADDRESS=0x48652Af3CeD9C41eB1F826e075330B758917B05B
```

## 🧪 Testing

1. **Check Backend Health**
   - Visit: https://mantle-o8d5.onrender.com/health
   - Should see: `{"status":"OK","uptime":...}`

2. **Test Frontend**
   - Run `npm run dev` in `nextjs-dapp/`
   - Connect MetaMask
   - Create a battle
   - Verify WebSocket connection in console

## 📱 Architecture

```
┌─────────────────┐
│  Your Laptop    │
│                 │
│  Frontend       │
│  localhost:3000 │
└────────┬────────┘
         │
         │ HTTPS/WSS
         │
         ▼
┌─────────────────────────────┐
│  Render.com (Cloud)         │
│                             │
│  Backend Agent              │
│  https://mantle-o8d5...     │
│                             │
│  ✅ Runs 24/7               │
│  ✅ Handles transactions    │
│  ✅ WebSocket server        │
└────────┬────────────────────┘
         │
         │ RPC
         │
         ▼
┌─────────────────────────────┐
│  Mantle Sepolia Blockchain  │
│                             │
│  Smart Contracts            │
└─────────────────────────────┘
```

## 🎮 Usage Flow

1. **Start Frontend**: `npm run dev` in `nextjs-dapp/`
2. **Connect Wallet**: Use MetaMask on Mantle Sepolia
3. **Play Game**: Backend handles everything automatically
4. **Close Laptop**: Backend keeps running on Render!

## 🔄 If Backend Spins Down (Free Tier)

The free tier spins down after 15 minutes of inactivity:
- First request takes 30-60 seconds to wake up
- Subsequent requests are fast
- Upgrade to Starter ($7/month) for always-on

## 🆘 Troubleshooting

### Backend Not Responding
- Check: https://mantle-o8d5.onrender.com/health
- If spinning down, wait 30-60 seconds
- Check Render dashboard for errors

### WebSocket Not Connecting
- Ensure using `wss://` (not `ws://`)
- Check browser console for errors
- Verify backend is running

### Frontend Errors
- Clear Next.js cache: `rm -rf .next`
- Reinstall: `npm install`
- Restart dev server: `npm run dev`

## 📝 Notes

- `.env.local` is gitignored (won't be pushed to GitHub)
- Backend URL is hardcoded as fallback in code
- All changes are committed and pushed to GitHub

## 🎉 You're All Set!

Your backend agent is running 24/7 on Render, and your frontend is configured to use it. Just run `npm run dev` in the `nextjs-dapp/` folder and start playing!

---

**Backend URL**: https://mantle-o8d5.onrender.com
**Health Check**: https://mantle-o8d5.onrender.com/health
**Frontend**: http://localhost:3000 (when running locally)
