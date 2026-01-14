# 🚀 Quick Start: Deploy to Render in 10 Minutes

## Step-by-Step Deployment

### 1️⃣ Sign Up for Render (2 minutes)
- Go to https://render.com
- Click "Get Started for Free"
- Sign up with GitHub (recommended)

### 2️⃣ Deploy Backend (4 minutes)

1. **Create New Web Service**
   - Dashboard → "New +" → "Web Service"
   - Connect GitHub → Select `krish2413179-prog/mantle`
   - Branch: `envio`

2. **Configure Backend**
   ```
   Name: stranger-things-backend
   Region: Oregon (US West)
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

3. **Add Environment Variables** (click "Advanced" → "Add Environment Variable")
   ```
   NODE_ENV=production
   PORT=3001
   MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
   AGENT_PRIVATE_KEY=0x020e83d7deacfc9d40a7ff4d09867ab543f527686770cfde44d3a44dabdadb66
   AGENT_ADDRESS=0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081
   GAME_REGISTRY_ADDRESS=0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A
   GHOST_DELEGATE_ADDRESS=0x2d84813B18a5d601A4ddc7153Ae44848Ff824D7A
   ADVANCED_PERMISSIONS_ADDRESS=0x48652Af3CeD9C41eB1F826e075330B758917B05B
   TEAM_DELEGATION_ADDRESS=0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes
   - Copy your backend URL (e.g., `https://stranger-things-backend.onrender.com`)

### 3️⃣ Deploy Frontend (4 minutes)

1. **Create Another Web Service**
   - Dashboard → "New +" → "Web Service"
   - Same repository: `krish2413179-prog/mantle`
   - Branch: `envio`

2. **Configure Frontend**
   ```
   Name: stranger-things-frontend
   Region: Oregon (US West)
   Root Directory: nextjs-dapp
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Instance Type: Free
   ```

3. **Add Environment Variables** (Replace `YOUR_BACKEND_URL` with URL from step 2)
   ```
   NODE_ENV=production
   NEXT_PUBLIC_BACKEND_URL=https://stranger-things-backend.onrender.com
   NEXT_PUBLIC_WS_URL=wss://stranger-things-backend.onrender.com
   NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
   NEXT_PUBLIC_CHAIN_ID=5003
   NEXT_PUBLIC_GAME_REGISTRY_ADDRESS=0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A
   NEXT_PUBLIC_GHOST_DELEGATE_ADDRESS=0x2d84813B18a5d601A4ddc7153Ae44848Ff824D7A
   NEXT_PUBLIC_ADVANCED_PERMISSIONS_ADDRESS=0x48652Af3CeD9C41eB1F826e075330B758917B05B
   NEXT_PUBLIC_TEAM_DELEGATION_ADDRESS=0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait 10-15 minutes
   - Your app is live! 🎉

### 4️⃣ Test Your Deployment

1. Visit your frontend URL
2. Connect MetaMask
3. Switch to Mantle Sepolia testnet
4. Create a battle and test voting!

---

## 📋 Environment Variables Checklist

### Backend Variables ✅
- [ ] NODE_ENV
- [ ] PORT
- [ ] MANTLE_RPC_URL
- [ ] AGENT_PRIVATE_KEY
- [ ] AGENT_ADDRESS
- [ ] GAME_REGISTRY_ADDRESS
- [ ] GHOST_DELEGATE_ADDRESS
- [ ] ADVANCED_PERMISSIONS_ADDRESS
- [ ] TEAM_DELEGATION_ADDRESS

### Frontend Variables ✅
- [ ] NODE_ENV
- [ ] NEXT_PUBLIC_BACKEND_URL
- [ ] NEXT_PUBLIC_WS_URL
- [ ] NEXT_PUBLIC_MANTLE_RPC_URL
- [ ] NEXT_PUBLIC_CHAIN_ID
- [ ] NEXT_PUBLIC_GAME_REGISTRY_ADDRESS
- [ ] NEXT_PUBLIC_GHOST_DELEGATE_ADDRESS
- [ ] NEXT_PUBLIC_ADVANCED_PERMISSIONS_ADDRESS
- [ ] NEXT_PUBLIC_TEAM_DELEGATION_ADDRESS

---

## 🔧 Common Issues & Fixes

### Backend Won't Start
**Problem**: Service fails to start
**Solution**: 
- Check all environment variables are set
- Verify private key starts with `0x`
- Check logs in Render dashboard

### Frontend Build Fails
**Problem**: Build command fails
**Solution**:
- Ensure backend URL is correct
- Check all NEXT_PUBLIC_ variables are set
- Review build logs for specific errors

### WebSocket Not Connecting
**Problem**: Real-time updates not working
**Solution**:
- Use `wss://` (not `ws://`)
- Verify backend URL in NEXT_PUBLIC_WS_URL
- Check backend is running

### Service Spins Down
**Problem**: First request takes 30+ seconds
**Solution**:
- This is normal on free tier
- Upgrade to Starter plan ($7/month) to prevent spin-down
- Or keep service warm with uptime monitoring

---

## 💡 Pro Tips

1. **Auto-Deploy**: Enable auto-deploy in Render settings to deploy on every git push
2. **Custom Domain**: Add your own domain in Render dashboard (free)
3. **Monitoring**: Use Render's built-in metrics and logs
4. **Scaling**: Upgrade to paid plan when you get traffic
5. **Environment**: Use separate services for staging/production

---

## 🎯 What You Get

✅ Backend API running 24/7
✅ Frontend hosted with CDN
✅ Automatic HTTPS
✅ WebSocket support
✅ Free SSL certificate
✅ Automatic deployments
✅ Built-in monitoring

---

## 📞 Need Help?

- **Render Docs**: https://render.com/docs
- **Community**: https://community.render.com
- **GitHub Issues**: https://github.com/krish2413179-prog/mantle/issues

---

**Total Time**: ~10 minutes
**Cost**: $0 (Free tier)
**Difficulty**: Easy 🟢

Happy deploying! 🚀
