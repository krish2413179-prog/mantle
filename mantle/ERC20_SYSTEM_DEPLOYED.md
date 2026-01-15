# ERC-20 Permission System - DEPLOYED & READY! 🎉

## ✅ Deployment Complete

### Contracts Deployed on Mantle Sepolia:
- **WMANTLE**: `0x157695Bd2966FBC0EE8440a7D60D9F8993AE7850`
- **ERC20Permissions**: `0xCF33dAE5C20BD3C3d7ABf25aB640bBbD61054453`

### Explorer Links:
- WMANTLE: https://explorer.sepolia.mantle.xyz/address/0x157695Bd2966FBC0EE8440a7D60D9F8993AE7850
- ERC20Permissions: https://explorer.sepolia.mantle.xyz/address/0xCF33dAE5C20BD3C3d7ABf25aB640bBbD61054453

---

## ✅ Code Updated

### Backend (`backend/server.js`):
- ✅ Updated to use `ERC20_PERMISSIONS_ADDRESS`
- ✅ Calls `executeTeamAction()` on ERC20Permissions contract
- ✅ Pulls WMANTLE from players' wallets automatically

### Frontend (`nextjs-dapp/src/lib/warBattleContract.ts`):
- ✅ Added `wrapMNT()` - Wrap MNT to WMANTLE
- ✅ Added `approveWMANTLE()` - Approve contract to spend
- ✅ Updated `grantPermissionToLeader()` - Grant permission (NO money sent!)
- ✅ Added `getWMANTLEBalance()` - Check WMANTLE balance
- ✅ Added `getWMANTLEAllowance()` - Check approval status

### Environment Variables:
- ✅ `backend/.env` - Added WMANTLE_ADDRESS and ERC20_PERMISSIONS_ADDRESS
- ✅ `nextjs-dapp/.env.local` - Added NEXT_PUBLIC_WMANTLE_ADDRESS and NEXT_PUBLIC_ERC20_PERMISSIONS_ADDRESS

---

## 🎮 How It Works Now

### Player Flow (3 Steps):

#### Step 1: Wrap MNT to WMANTLE
```typescript
// Player clicks "Wrap MNT"
const result = await wrapMNT("0.1") // Wrap 0.1 MNT
// Player now has 0.1 WMANTLE in wallet
```

#### Step 2: Approve Contract
```typescript
// Player clicks "Approve Contract"
const result = await approveWMANTLE("0.1") // Approve 0.1 WMANTLE
// Contract can now pull up to 0.1 WMANTLE from wallet
```

#### Step 3: Grant Permission
```typescript
// Player clicks "Grant Permission"
const result = await grantPermissionToLeader(leaderAddress, "0.1")
// Permission granted! NO MONEY SENT!
// Money stays in wallet until weapon is used
```

### Weapon Launch (Automatic):
```typescript
// Vote passes → Backend executes
// NO player signature needed!
const tx = await erc20PermissionsContract.executeTeamAction(
  [player1, player2],
  [0.003, 0.003]
)
// Contract automatically pulls 0.003 WMANTLE from each player's wallet
// Backend receives 0.006 WMANTLE total
```

---

## 🎯 Key Benefits

### ✅ Money Stays in Wallet
- Player wraps MNT → WMANTLE
- WMANTLE stays in player's wallet
- Only pulled when weapon is used

### ✅ One-Time Approval
- Player approves once
- No signature per weapon
- Backend executes gaslessly

### ✅ Spending Cap Enforced
- Player sets max (e.g., 0.1 WMANTLE)
- Contract tracks spent amount
- Cannot exceed cap

### ✅ Easy Revoke
- Player calls `revokePermission()`
- Unspent WMANTLE stays in wallet
- No refund needed!

### ✅ TRUE ERC-7715 Style
- Just like USDC/USDT approval
- Money never leaves wallet until used
- Exactly what you wanted!

---

## 📝 Next Steps for Frontend

### Update DelegationPage.tsx to add 3 steps:

```tsx
// Step 1: Wrap MNT
<button onClick={async () => {
  const result = await wrapMNT(amount)
  if (result.success) {
    setStep('approve')
  }
}}>
  Step 1: Wrap {amount} MNT → WMANTLE
</button>

// Step 2: Approve
<button onClick={async () => {
  const result = await approveWMANTLE(amount)
  if (result.success) {
    setStep('grant')
  }
}}>
  Step 2: Approve Contract
</button>

// Step 3: Grant Permission
<button onClick={async () => {
  const result = await grantPermissionToLeader(leaderAddress, amount)
  if (result.success) {
    onDelegationComplete(result.txHash, parseFloat(amount))
  }
}}>
  Step 3: Grant Permission (NO Money Sent!)
</button>
```

---

## 🧪 Testing

### Test Locally:
1. ✅ Backend running on `http://localhost:3001`
2. Start frontend: `cd nextjs-dapp && npm run dev`
3. Test the 3-step flow:
   - Wrap MNT → WMANTLE
   - Approve contract
   - Grant permission
4. Launch weapon and verify WMANTLE is pulled from wallet

### Check on Explorer:
- Wrap transaction: Should show MNT sent to WMANTLE contract
- Approve transaction: Should show approval event
- Grant permission: Should show PermissionGranted event (NO value!)
- Weapon launch: Should show WMANTLE transfer from player to backend

---

## 🚀 Deploy to Render

Once tested locally:
1. Commit and push changes
2. Render will auto-deploy backend
3. Update frontend .env.local to use Render URL
4. Deploy frontend

---

## 📊 Summary

**EXACTLY what you wanted:**
- ✅ Grant permission = Just sign, NO money sent
- ✅ Money stays in wallet
- ✅ When weapon vote passes, money is deducted
- ✅ No signature per weapon
- ✅ Spending cap enforced
- ✅ TRUE ERC-7715 style using ERC-20 approval!

**Backend is running locally and ready to test!** 🎉
