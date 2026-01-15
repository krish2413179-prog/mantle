# Render Deployment Configuration

## Backend URL
The backend is deployed on Render at:
- **HTTP**: `https://mantle-o8d5.onrender.com`
- **WebSocket**: `wss://mantle-o8d5.onrender.com`

## Frontend Configuration

Update `nextjs-dapp/.env.local` with the following:

```env
# Backend Agent URL (Render deployment)
NEXT_PUBLIC_BACKEND_URL=https://mantle-o8d5.onrender.com
# WebSocket uses same URL as backend (same port)
NEXT_PUBLIC_WS_URL=wss://mantle-o8d5.onrender.com

# Contract Addresses
NEXT_PUBLIC_TEAM_DELEGATION_ADDRESS=0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4
NEXT_PUBLIC_GAME_REGISTRY_ADDRESS=0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A
NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_ADVANCED_PERMISSIONS_ADDRESS=0x48652Af3CeD9C41eB1F826e075330B758917B05B

# NEW: Simple Game Payment (WMANTLE as game currency)
NEXT_PUBLIC_WMANTLE_ADDRESS=0x157695Bd2966FBC0EE8440a7D60D9F8993AE7850
NEXT_PUBLIC_GAME_PAYMENT_ADDRESS=0xD2c30a46Ac468F67f7C2eb7Bd60bf33b6Cfb388b
```

## Local Development

For local development, use:

```env
# Backend Agent URL (LOCAL for testing)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
# WebSocket uses same URL as backend (same port)
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

## Notes
- The backend on Render may take 30-60 seconds to wake up from sleep on first request
- WebSocket connections use `wss://` (secure) for production
- All contract addresses remain the same (deployed on Mantle Sepolia)
