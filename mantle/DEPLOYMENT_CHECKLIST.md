# ✅ Render Deployment Checklist

## Pre-Deployment
- [ ] GitHub account created
- [ ] Code pushed to repository
- [ ] Render account created (https://render.com)
- [ ] Contract addresses ready
- [ ] Private keys ready

---

## Backend Deployment

### Create Service
- [ ] Go to Render Dashboard
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Select `krish2413179-prog/mantle` repo
- [ ] Select branch: `envio`

### Configure Service
- [ ] Name: `stranger-things-backend`
- [ ] Region: Oregon (US West)
- [ ] Root Directory: `backend`
- [ ] Runtime: Node
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Instance Type: Free

### Add Environment Variables
- [ ] NODE_ENV=production
- [ ] PORT=3001
- [ ] MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
- [ ] AGENT_PRIVATE_KEY=0x020e83d7deacfc9d40a7ff4d09867ab543f527686770cfde44d3a44dabdadb66
- [ ] AGENT_ADDRESS=0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081
- [ ] GAME_REGISTRY_ADDRESS=0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A
- [ ] GHOST_DELEGATE_ADDRESS=0x2d84813B18a5d601A4ddc7153Ae44848Ff824D7A
- [ ] ADVANCED_PERMISSIONS_ADDRESS=0x48652Af3CeD9C41eB1F826e075330B758917B05B
- [ ] TEAM_DELEGATION_ADDRESS=0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4

### Deploy & Verify
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (5-10 minutes)
- [ ] Copy backend URL
- [ ] Test health endpoint: `https://your-backend-url/health`

---

## Frontend Deployment

### Create Service
- [ ] Click "New +" → "Web Service"
- [ ] Select same repository
- [ ] Select branch: `envio`

### Configure Service
- [ ] Name: `stranger-things-frontend`
- [ ] Region: Oregon (US West)
- [ ] Root Directory: `nextjs-dapp`
- [ ] Runtime: Node
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Instance Type: Free

### Add Environment Variables (Replace YOUR_BACKEND_URL)
- [ ] NODE_ENV=production
- [ ] NEXT_PUBLIC_BACKEND_URL=https://YOUR-BACKEND-URL.onrender.com
- [ ] NEXT_PUBLIC_WS_URL=wss://YOUR-BACKEND-URL.onrender.com
- [ ] NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
- [ ] NEXT_PUBLIC_CHAIN_ID=5003
- [ ] NEXT_PUBLIC_GAME_REGISTRY_ADDRESS=0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A
- [ ] NEXT_PUBLIC_GHOST_DELEGATE_ADDRESS=0x2d84813B18a5d601A4ddc7153Ae44848Ff824D7A
- [ ] NEXT_PUBLIC_ADVANCED_PERMISSIONS_ADDRESS=0x48652Af3CeD9C41eB1F826e075330B758917B05B
- [ ] NEXT_PUBLIC_TEAM_DELEGATION_ADDRESS=0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4

### Deploy & Verify
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (10-15 minutes)
- [ ] Copy frontend URL
- [ ] Visit frontend URL in browser

---

## Post-Deployment Testing

### Basic Tests
- [ ] Frontend loads successfully
- [ ] Landing page displays correctly
- [ ] Connect MetaMask wallet
- [ ] Switch to Mantle Sepolia testnet
- [ ] Create a new battle
- [ ] Join battle with another account
- [ ] Test delegation system
- [ ] Test voting system (10s window)
- [ ] Verify real-time updates work
- [ ] Complete a round
- [ ] Test all 5 rounds
- [ ] Verify gasless transactions

### Technical Tests
- [ ] Backend health check responds
- [ ] WebSocket connection works
- [ ] No console errors
- [ ] Mobile responsive
- [ ] HTTPS enabled
- [ ] CORS working correctly

---

## Optional Enhancements

### Configuration
- [ ] Enable auto-deploy on git push
- [ ] Add custom domain
- [ ] Set up environment groups
- [ ] Configure health check path

### Monitoring
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Add error tracking (Sentry)
- [ ] Configure alerts
- [ ] Review logs regularly

### Performance
- [ ] Consider upgrading to Starter plan ($7/month)
- [ ] Enable CDN for static assets
- [ ] Optimize build size
- [ ] Add caching headers

---

## Troubleshooting Checklist

### If Backend Fails
- [ ] Check all environment variables are set
- [ ] Verify private key format (starts with 0x)
- [ ] Review build logs
- [ ] Check runtime logs
- [ ] Verify Node.js version compatibility

### If Frontend Fails
- [ ] Verify backend URL is correct
- [ ] Check all NEXT_PUBLIC_ variables
- [ ] Review build logs
- [ ] Check for TypeScript errors
- [ ] Verify dependencies installed

### If WebSocket Fails
- [ ] Use wss:// protocol (not ws://)
- [ ] Check backend is running
- [ ] Verify CORS settings
- [ ] Test WebSocket endpoint directly

---

## Success Criteria

✅ Backend deployed and responding
✅ Frontend deployed and accessible
✅ Health check endpoint working
✅ WebSocket connection established
✅ Can create and join battles
✅ Voting system functional
✅ Real-time updates working
✅ Gasless transactions executing
✅ All 5 rounds playable
✅ No critical errors in logs

---

## Resources

📖 Quick Start: `RENDER_QUICK_START.md`
📖 Full Guide: `DEPLOYMENT_GUIDE.md`
📖 Summary: `DEPLOYMENT_SUMMARY.md`
🌐 Render Docs: https://render.com/docs
💬 Community: https://community.render.com

---

**Estimated Time**: 10-15 minutes
**Cost**: $0 (Free tier)
**Difficulty**: Easy 🟢

Good luck with your deployment! 🚀
