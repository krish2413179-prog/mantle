# Vercel Deployment Guide - Frontend

## Prerequisites
- GitHub account with your code pushed
- Vercel account (free tier works)

## Step-by-Step Deployment Process

### Step 1: Sign Up / Login to Vercel
1. Go to https://vercel.com
2. Click "Sign Up" or "Login"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub repositories

### Step 2: Import Your Project
1. Click "Add New..." → "Project"
2. Find your repository: `krish2413179-prog/mantle`
3. Click "Import"

### Step 3: Configure Project Settings
1. **Framework Preset**: Next.js (should auto-detect)
2. **Root Directory**: Click "Edit" and set to `nextjs-dapp`
   - This is CRITICAL because your Next.js app is in a subfolder
3. **Build Command**: Leave as default (`next build`)
4. **Output Directory**: Leave as default (`.next`)
5. **Install Command**: Leave as default (`npm install`)

### Step 4: Add Environment Variables
Click "Environment Variables" and add these:

```
NEXT_PUBLIC_BACKEND_URL=https://mantle-o8d5.onrender.com
NEXT_PUBLIC_WS_URL=wss://mantle-o8d5.onrender.com
NEXT_PUBLIC_TEAM_DELEGATION_ADDRESS=0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4
NEXT_PUBLIC_GAME_REGISTRY_ADDRESS=0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A
NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_ADVANCED_PERMISSIONS_ADDRESS=0x48652Af3CeD9C41eB1F826e075330B758917B05B
NEXT_PUBLIC_WMANTLE_ADDRESS=0x157695Bd2966FBC0EE8440a7D60D9F8993AE7850
NEXT_PUBLIC_GAME_PAYMENT_ADDRESS=0xD2c30a46Ac468F67f7C2eb7Bd60bf33b6Cfb388b
```

**How to add each variable:**
- Name: `NEXT_PUBLIC_BACKEND_URL`
- Value: `https://mantle-o8d5.onrender.com`
- Click "Add"
- Repeat for all variables above

### Step 5: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. You'll see "Congratulations!" when done

### Step 6: Get Your Live URL
- Your app will be live at: `https://your-project-name.vercel.app`
- Vercel will show you the URL after deployment

### Step 7: Test Your Deployment
1. Visit your Vercel URL
2. Connect your MetaMask wallet
3. Test the game features:
   - Wrap MNT → WMANTLE
   - Create/Join multiplayer room
   - Play solo mode
   - Launch weapons

## Common Issues & Solutions

### Issue 1: Build Fails - "Cannot find module"
**Solution**: Make sure Root Directory is set to `nextjs-dapp`

### Issue 2: Environment Variables Not Working
**Solution**: 
- Make sure all variables start with `NEXT_PUBLIC_`
- Redeploy after adding variables

### Issue 3: WebSocket Connection Fails
**Solution**: 
- Check that `NEXT_PUBLIC_WS_URL` uses `wss://` (not `ws://`)
- Verify backend is running on Render

### Issue 4: Wallet Connection Issues
**Solution**: 
- Make sure you're on Mantle Sepolia network
- Check contract addresses are correct

## Updating Your Deployment

### Option 1: Automatic (Recommended)
1. Push code to GitHub
2. Vercel automatically rebuilds and deploys
3. Wait 2-3 minutes

### Option 2: Manual
1. Go to Vercel dashboard
2. Click your project
3. Click "Deployments" tab
4. Click "Redeploy" on latest deployment

## Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-30 minutes)

## Vercel Dashboard Features
- **Deployments**: See all deployment history
- **Analytics**: View traffic and performance
- **Logs**: Debug issues in real-time
- **Settings**: Update environment variables, domains, etc.

## Production Checklist
- ✅ Root directory set to `nextjs-dapp`
- ✅ All environment variables added
- ✅ Backend URL points to Render deployment
- ✅ WebSocket URL uses `wss://`
- ✅ All contract addresses correct
- ✅ Build succeeds without errors
- ✅ Wallet connection works
- ✅ Game features tested

## Support
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Your Backend: https://mantle-o8d5.onrender.com

## Quick Commands (After Setup)
```bash
# Push to GitHub (triggers auto-deploy)
git add .
git commit -m "Your changes"
git push origin envio

# Vercel will automatically deploy in 2-3 minutes
```

## Expected URLs
- **Frontend**: `https://your-project-name.vercel.app`
- **Backend**: `https://mantle-o8d5.onrender.com`
- **GitHub**: `https://github.com/krish2413179-prog/mantle`
