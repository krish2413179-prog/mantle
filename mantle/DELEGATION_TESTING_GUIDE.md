# 🔐 Delegation Testing Guide - MetaMask Advanced Permissions

## ✅ What We Fixed

### Previous Issues:
- ❌ Team members had hardcoded `delegatedAmount` values
- ❌ No real MetaMask transactions were happening
- ❌ Backend was generating fake transaction hashes

### Current Implementation:
- ✅ Team members start with `delegatedAmount: 0` (no hardcoding)
- ✅ Real blockchain transactions using ethers.js
- ✅ MetaMask popup triggers for delegation
- ✅ Real transaction hashes from Mantle Sepolia
- ✅ Wallet status checks before delegation
- ✅ Network verification (Mantle Sepolia)
- ✅ Comprehensive error handling

## 🎮 How to Test the Complete Flow

### Step 1: Setup (Both Players)
1. **Install MetaMask** (if not already installed)
2. **Switch to Mantle Sepolia Network**
   - Network Name: `Mantle Sepolia`
   - RPC URL: `https://rpc.sepolia.mantle.xyz`
   - Chain ID: `5003`
   - Currency Symbol: `MNT`
   - Block Explorer: `https://explorer.sepolia.mantle.xyz`

3. **Get Test MNT**
   - Visit: https://faucet.sepolia.mantle.xyz
   - Request test MNT for both wallets
   - You need at least 0.15 MNT (0.1 for delegation + gas fees)

### Step 2: Start Multiplayer Battle

#### Player 1 (Host/Team Leader):
1. Open http://localhost:3000
2. Connect MetaMask wallet
3. Click "Create Room"
4. Share room code with teammate
5. Select character (e.g., Eleven)
6. Click "Ready"
7. Wait for teammate to join and ready up
8. Click "Start Game" (only host sees this)

#### Player 2 (Teammate):
1. Open http://localhost:3000 (in different browser/incognito)
2. Connect MetaMask wallet (different account)
3. Click "Join Room"
4. Enter room code
5. Select character (different from host)
6. Click "Ready"
7. Wait for host to start game

### Step 3: Delegation Flow (Teammate Only)

When the battle starts, **teammates** (non-host) will see the **Delegation Page**:

#### What You Should See:
1. **Wallet Status Check** (automatic)
   - ✅ Green box: "Wallet ready! You can proceed with delegation"
   - ❌ Red box: Shows specific issue (wrong network, not connected, etc.)

2. **Delegation Details**
   - Amount: 0.1 MNT
   - Duration: 24 hours
   - Team Leader info with character image
   - Security information

3. **Click "Delegate 0.1 MNT (Sign with MetaMask)"**

#### What Should Happen:
1. **MetaMask Popup Appears** 🦊
   - Shows transaction details
   - Amount: 0.1 MNT
   - To: TeamDelegation Contract
   - Gas fees displayed

2. **Approve in MetaMask**
   - Click "Confirm"
   - Transaction is sent to blockchain

3. **Confirmation Screen**
   - Shows transaction hash
   - Link to Mantle Sepolia explorer
   - "Entering battle arena..." message

4. **Backend Updates**
   - WebSocket sends `WAR_DELEGATION_COMPLETE`
   - Backend updates team member's `delegatedAmount: 0.1`
   - All players see updated team pool

### Step 4: Launch Weapons (Team Leader Only)

Once teammates have delegated, the **team leader** can launch weapons:

1. **Check Team Pool**
   - Top right shows total pool (e.g., "0.2 MNT" if 2 teammates delegated)

2. **Select Weapon**
   - Molotov Cocktail: 0.001 MNT
   - Flamethrower: 0.003 MNT
   - Grenade: 0.005 MNT
   - Rocket: 0.008 MNT
   - Nuclear: 0.015 MNT

3. **Click Weapon Card**

#### What Should Happen:
1. **MetaMask Popup Appears** 🦊
   - Shows `executeTeamAction` transaction
   - Spending from multiple wallets
   - Gas fees displayed

2. **Approve in MetaMask**
   - Transaction executes on-chain
   - Spends from all delegated team members

3. **Battle Updates**
   - Enemy takes damage
   - Team pool decreases
   - Transaction appears in Battle Log
   - Each member sees their spent amount

### Step 5: Revoke Permission (Teammate)

Teammates can revoke delegation anytime:

1. **Click "🚨 Revoke Permission (Emergency)"**

#### What Should Happen:
1. **MetaMask Popup Appears** 🦊
   - Shows `revokePermission` transaction
   - Refunds unspent MNT

2. **Approve in MetaMask**
   - Transaction executes
   - Unspent funds returned to wallet

3. **Updates**
   - Team pool decreases
   - Member shows as inactive
   - Transaction in Battle Log

## 🔍 Debugging

### Check Browser Console (F12)
Look for these logs:

#### Delegation Start:
```
🔐 Starting delegation process...
📍 Step 1: Getting signer from MetaMask...
✅ Step 1 complete: Signer obtained
📍 Step 2: Preparing transaction...
✅ Step 2 complete: Transaction prepared
📍 Step 3: Sending transaction to MetaMask...
⚠️ PLEASE CHECK YOUR METAMASK - A popup should appear now!
```

#### If MetaMask Popup Appears:
```
✅ Step 3 complete: Transaction signed!
⏳ Transaction sent: 0x...
📍 Step 4: Waiting for blockchain confirmation...
✅ Step 4 complete: Transaction confirmed!
```

#### Backend Logs:
```
🔐 Delegation completed: 0x... delegated 0.1 MNT
📝 Transaction: 0x...
✅ Player delegation recorded on-chain: 0x...
```

### Common Issues & Solutions

#### ❌ "MetaMask not detected"
- **Solution**: Install MetaMask extension
- Refresh page after installation

#### ❌ "Wallet not connected"
- **Solution**: Click MetaMask icon → Connect
- Refresh page

#### ❌ "Wrong network"
- **Solution**: Open MetaMask → Switch to Mantle Sepolia
- Network details in Step 1 above

#### ❌ "Insufficient MNT balance"
- **Solution**: Get test MNT from faucet
- https://faucet.sepolia.mantle.xyz

#### ❌ "Transaction was rejected"
- **Solution**: You clicked "Reject" in MetaMask
- Click "Delegate" button again and approve

#### ❌ MetaMask popup doesn't appear
- **Check**: Is MetaMask unlocked?
- **Check**: Browser console for errors
- **Check**: MetaMask extension enabled
- **Try**: Refresh page and try again

## 📝 Verify Transactions On-Chain

### View on Mantle Sepolia Explorer:
1. Copy transaction hash from console or UI
2. Visit: https://explorer.sepolia.mantle.xyz
3. Paste transaction hash
4. See:
   - From: Your wallet
   - To: TeamDelegation contract
   - Value: 0.1 MNT
   - Status: Success ✅

### Contract Addresses:
- **TeamDelegation**: `0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4`
- **GameRegistry**: `0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A`
- **GhostSessionDelegate**: `0x2d84813B18a5d601A4ddc7153Ae44848Ff824D7A`
- **TeamLeaderNFT**: `0xE38449796438b6276AfcF9b3B32AA2F0B5247590`

## 🎯 Expected Behavior Summary

### For Team Leader (Host):
- ✅ Sees weapon arsenal
- ✅ Can launch weapons when pool > 0
- ✅ MetaMask popup for each weapon launch
- ✅ Spends from multiple team members
- ✅ Real on-chain transactions

### For Team Members (Non-Host):
- ✅ Sees delegation page first
- ✅ Wallet status check before delegation
- ✅ MetaMask popup for delegation
- ✅ Real 0.1 MNT sent to contract
- ✅ Can revoke anytime
- ✅ Sees team status and battle log

### For All Players:
- ✅ Real-time updates via WebSocket
- ✅ All transactions verifiable on-chain
- ✅ No hardcoded values
- ✅ No fake transaction hashes
- ✅ Proper error handling

## 🚀 Next Steps

If everything works:
1. ✅ Delegation triggers MetaMask popup
2. ✅ Transaction appears on Mantle Sepolia explorer
3. ✅ Team pool updates in real-time
4. ✅ Weapon launches spend from multiple wallets
5. ✅ Revoke returns unspent funds

**You have successfully implemented MetaMask Advanced Permissions!** 🎉

## 📞 Still Having Issues?

Check:
1. Both processes running (backend on 3001, frontend on 3000)
2. MetaMask installed and unlocked
3. Correct network (Mantle Sepolia, Chain ID 5003)
4. Sufficient MNT balance (0.15+ MNT)
5. Browser console for detailed error logs
6. Backend terminal for server-side logs

Share the console logs if you need help debugging!
