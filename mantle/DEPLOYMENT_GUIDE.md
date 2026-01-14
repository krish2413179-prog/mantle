# Deployment Guide for Render

This guide will help you deploy the Stranger Things Battle DApp on Render.

## Prerequisites

1. GitHub account with your code pushed
2. Render account (sign up at https://render.com)
3. Your contract addresses and private keys ready

## Step 1: Prepare Your Repository

Your code is already pushed to GitHub at: `https://github.com/krish2413179-prog/mantle.git` (branch: `envio`)

## Step 2: Deploy Backend Service

### 2.1 Create Backend Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the `mantle` repository
5. Configure the service:
   - **Name**: `stranger-things-backend`
   - **Region**: Oregon (US West) or closest to you
   - **Branch**: `envio`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 2.2 Add Backend Environment Variables

In the Environment section, add these variables:

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

### 2.3 Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment to complete (5-10 minutes)
3. Note your backend URL (e.g., `https://stranger-things-backend.onrender.com`)

## Step 3: Deploy Frontend Service

### 3.1 Create Frontend Web Service

1. Click **"New +"** → **"Web Service"** again
2. Select the same `mantle` repository
3. Configure the service:
   - **Name**: `stranger-things-frontend`
   - **Region**: Same as backend
   - **Branch**: `envio`
   - **Root Directory**: `nextjs-dapp`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3.2 Add Frontend Environment Variables

Replace `YOUR_BACKEND_URL` with the URL from Step 2.3:

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

### 3.3 Deploy Frontend

1. Click **"Create Web Service"**
2. Wait for deployment to complete (10-15 minutes)
3. Your app will be live at the provided URL (e.g., `https://stranger-things-frontend.onrender.com`)

## Step 4: Update Backend CORS Settings

After frontend is deployed, you need to update backend CORS:

1. Go to your backend service on Render
2. Add environment variable:
   ```
   FRONTEND_URL=https://stranger-things-frontend.onrender.com
   ```
3. The backend will automatically restart

## Step 5: Test Your Deployment

1. Visit your frontend URL
2. Connect your MetaMask wallet
3. Make sure you're on Mantle Sepolia testnet
4. Try creating a battle and testing the voting system

## Important Notes

### Free Tier Limitations

- Services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month free (enough for one service)

### WebSocket Support

Render's free tier supports WebSockets, but:
- Use `wss://` protocol (not `ws://`)
- Connection may drop on service restart
- Frontend should handle reconnection

### Monitoring

1. Check logs in Render dashboard
2. Backend health endpoint: `https://your-backend-url/health`
3. Monitor for errors in the Logs tab

## Troubleshooting

### Backend Won't Start

1. Check environment variables are set correctly
2. Verify private key format (should start with 0x)
3. Check logs for specific errors

### Frontend Build Fails

1. Ensure all dependencies are in package.json
2. Check for TypeScript errors
3. Verify environment variables are set

### WebSocket Connection Issues

1. Use `wss://` instead of `ws://`
2. Check CORS settings on backend
3. Verify backend is running and accessible

### Database Connection (if using)

1. Create a PostgreSQL database on Render
2. Add DATABASE_URL to backend environment variables
3. Run migrations if needed

## Alternative: Using render.yaml

You can also use the included `render.yaml` file for automated deployment:

1. Push `render.yaml` to your repository
2. In Render dashboard, click **"New +"** → **"Blueprint"**
3. Connect your repository
4. Render will automatically create both services
5. Add environment variables manually after creation

## Upgrading to Paid Plan

For production use, consider upgrading:
- **Starter Plan ($7/month)**: No spin-down, better performance
- **Standard Plan ($25/month)**: More resources, better for high traffic

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- GitHub Issues: https://github.com/krish2413179-prog/mantle/issues

## Next Steps

1. Set up custom domain (optional)
2. Enable HTTPS (automatic on Render)
3. Set up monitoring and alerts
4. Configure auto-deploy on git push
5. Add health checks and auto-restart

---

**Your deployment is complete!** 🎉

Share your live URL and start battling Demogorgons!
