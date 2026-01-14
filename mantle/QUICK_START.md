# 🚀 Quick Start - Test Real Delegation NOW

## ⚡ 3-Minute Setup

### 1. Check Processes (Already Running ✅)
```bash
Backend: http://localhost:3001 ✅
Frontend: http://localhost:3000 ✅
```

### 2. MetaMask Setup (2 minutes)
**Add Mantle Sepolia Network:**
- Network Name: `Mantle Sepolia`
- RPC URL: `https://rpc.sepolia.mantle.xyz`
- Chain ID: `5003`
- Currency: `MNT`
- Explorer: `https://explorer.sepolia.mantle.xyz`

**Get Test MNT:**
- Visit: https://faucet.sepolia.mantle.xyz
- Request 0.5 MNT for each wallet

### 3. Test Flow (1 minute)

#### Player 1 (Host):
1. Open http://localhost:3000
2. Connect MetaMask
3. Create Room → Share code
4. Select character → Ready
5. Start Game

#### Player 2 (Teammate):
1. Open http://localhost:3000 (incognito/different browser)
2. Connect MetaMask (different wallet)
3. Join Room → Enter code
4. Select character → Ready
5. **DELEGATION PAGE APPEARS** 🎯

### 4. The Magic Moment 🦊

**Teammate sees:**
- ✅ Wallet status check
- ✅ "Delegate 0.1 MNT" button

**Click button:**
- 🦊 **MetaMask popup appears!**
- Shows: 0.1 MNT to TeamDelegation contract
- Click "Confirm"

**Result:**
- ✅ Real transaction on Mantle Sepolia
- ✅ Transaction hash displayed
- ✅ Team pool updates
- ✅ Leader can now launch weapons

### 5. Launch Weapon (Leader)

**Leader clicks weapon:**
- 🦊 **MetaMask popup appears again!**
- Shows: executeTeamAction
- Spending from multiple wallets
- Click "Confirm"

**Result:**
- ✅ Enemy takes damage
- ✅ Team pool decreases
- ✅ All players see transaction

## 🔍 What to Look For

### Browser Console (F12):
```
🔐 Starting delegation process...
📍 Step 1: Getting signer from MetaMask...
✅ Step 1 complete: Signer obtained
📍 Step 2: Preparing transaction...
✅ Step 2 complete: Transaction prepared
📍 Step 3: Sending transaction to MetaMask...
⚠️ PLEASE CHECK YOUR METAMASK - A popup should appear now!
✅ Step 3 complete: Transaction signed!
⏳ Transaction sent: 0x...
✅ Step 4 complete: Transaction confirmed!
```

### Backend Terminal:
```
🔐 Delegation completed: 0x... delegated 0.1 MNT
📝 Transaction: 0x...
✅ Player delegation recorded on-chain: 0x...
```

## ❌ Troubleshooting

### MetaMask popup doesn't appear?
1. **Check**: Is MetaMask unlocked?
2. **Check**: Correct network (Mantle Sepolia)?
3. **Check**: Sufficient balance (0.15+ MNT)?
4. **Try**: Refresh page and try again

### "Wallet not connected" error?
1. Click MetaMask icon
2. Click "Connect"
3. Refresh page

### "Wrong network" error?
1. Open MetaMask
2. Click network dropdown
3. Select "Mantle Sepolia"
4. Refresh page

## ✅ Success Indicators

- [x] MetaMask popup appears when clicking "Delegate"
- [x] Transaction hash shown after confirmation
- [x] Team pool updates in real-time
- [x] Transaction visible on explorer
- [x] Leader can launch weapons
- [x] MetaMask popup for weapon launch
- [x] Enemy health decreases

## 🎉 You're Done!

If you see MetaMask popups and transactions on the explorer, **you've successfully implemented MetaMask Advanced Permissions!**

## 📚 More Details

- **Full Testing Guide**: `DELEGATION_TESTING_GUIDE.md`
- **Implementation Details**: `REAL_BLOCKCHAIN_IMPLEMENTATION.md`
- **Contract Addresses**: Check `.env.local` files

## 🔗 Important Links

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Explorer**: https://explorer.sepolia.mantle.xyz
- **Faucet**: https://faucet.sepolia.mantle.xyz
- **TeamDelegation Contract**: `0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4`

---

**Ready? Open http://localhost:3000 and start testing!** 🚀
