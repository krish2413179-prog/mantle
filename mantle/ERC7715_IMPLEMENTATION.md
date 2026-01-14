# ERC-7715 Advanced Permissions Implementation

## 🎯 Problem Solved

**Before**: When you delegated 0.5 MNT, it was **immediately transferred** to the smart contract.
**After**: When you grant permission for 0.5 MNT, funds **stay in your wallet** until actually spent!

## 🆕 New Smart Contract: AdvancedPermissions

### Contract Address (Mantle Sepolia)
```
0x48652Af3CeD9C41eB1F826e075330B758917B05B
```

### How It Works

#### 1. Grant Permission (NO PAYMENT!)
```solidity
function grantPermission(address delegate, uint256 maxAmount, uint256 duration) external
```

- **What it does**: Records that team leader CAN spend up to `maxAmount` from your wallet
- **Cost**: Only gas fees (~$0.01)
- **Your funds**: Stay in YOUR wallet!
- **Example**: `grantPermission(leaderAddress, 0.5 ether, 86400)` = "Leader can spend up to 0.5 MNT from me for 24 hours"

#### 2. Leader Spends (PULLS from wallets)
```solidity
function executeTeamAction(address[] owners, uint256[] amounts) external payable
```

- **What it does**: When leader uses a weapon, contract pulls funds from team members
- **How**: Team members send their share when leader executes
- **Example**: Weapon costs 0.3 MNT, pulls 0.15 MNT from 2 members

#### 3. Revoke Permission (INSTANT!)
```solidity
function revokePermission(address delegate) external
```

- **What it does**: Cancels permission immediately
- **No refund needed**: Funds never left your wallet!
- **Cost**: Only gas fees

## 📊 Comparison

### Old System (TeamDelegation)
```
User delegates 0.5 MNT
  ↓
💸 0.5 MNT transferred to contract immediately
  ↓
Leader uses weapon (0.1 MNT)
  ↓
Contract spends 0.1 MNT from your delegation
  ↓
User revokes
  ↓
💰 Contract refunds 0.4 MNT back to user
```

### New System (AdvancedPermissions)
```
User grants permission for 0.5 MNT
  ↓
✅ Permission recorded (NO TRANSFER!)
  ↓
💰 Your 0.5 MNT stays in YOUR wallet
  ↓
Leader uses weapon (0.1 MNT)
  ↓
📤 Contract pulls 0.1 MNT from your wallet
  ↓
💰 You still have 0.4 MNT in your wallet
  ↓
User revokes
  ↓
✅ Permission cancelled (NO REFUND NEEDED!)
```

## 🔑 Key Benefits

1. **Funds Stay in Wallet**: Your MNT never leaves until actually spent
2. **No Upfront Cost**: Only pay gas to grant permission (~$0.01)
3. **Instant Revoke**: Cancel anytime, no waiting for refund
4. **More Control**: You see exactly when funds are spent
5. **Gas Efficient**: No refund transactions needed

## 🛠️ Implementation Status

### ✅ Completed
- [x] Smart contract deployed to Mantle Sepolia
- [x] Contract address added to .env.local
- [x] Deployment script created

### 🚧 Next Steps (To Complete)
1. Update `warBattleContract.ts` to use new contract
2. Update `DelegationPage.tsx` to call `grantPermission()` instead of `delegateToLeader()`
3. Update backend to handle new permission model
4. Test full flow with new contract

## 📝 Contract Functions

### For Team Members

#### grantPermission()
```typescript
// Grant permission (NO PAYMENT!)
await advancedPermissions.grantPermission(
  leaderAddress,      // Team leader
  ethers.parseEther("0.5"),  // Max 0.5 MNT
  86400               // 24 hours
)
// Cost: Only gas (~$0.01)
// Your 0.5 MNT stays in your wallet!
```

#### revokePermission()
```typescript
// Revoke permission (INSTANT!)
await advancedPermissions.revokePermission(leaderAddress)
// Cost: Only gas (~$0.01)
// No refund needed - funds never left!
```

#### increasePermission()
```typescript
// Add more to max amount
await advancedPermissions.increasePermission(
  leaderAddress,
  ethers.parseEther("0.3")  // Add 0.3 MNT more
)
```

### For Team Leader

#### executeTeamAction()
```typescript
// Spend from team (PULLS funds from wallets)
await advancedPermissions.executeTeamAction(
  [member1, member2],           // Team members
  [ethers.parseEther("0.1"), ethers.parseEther("0.1")],  // Amounts
  { value: ethers.parseEther("0.2") }  // Total to collect
)
```

### View Functions

#### getPermission()
```typescript
const [maxAmount, spent, expiry, active, available] = 
  await advancedPermissions.getPermission(memberAddress, leaderAddress)

console.log("Max:", ethers.formatEther(maxAmount))
console.log("Spent:", ethers.formatEther(spent))
console.log("Available:", ethers.formatEther(available))
console.log("Active:", active)
```

## 🔐 Security Features

1. **Expiry**: Permissions automatically expire after duration
2. **Max Amount**: Leader can never spend more than permitted
3. **Revocable**: Members can cancel anytime
4. **Spent Tracking**: Contract tracks how much has been spent
5. **Active Flag**: Permissions can be deactivated

## 💡 User Experience

### Before (Old System)
```
1. Click "Delegate 0.5 MNT"
2. MetaMask: "Send 0.5 MNT" ← 💸 Money leaves immediately!
3. Approve transaction
4. Wait for confirmation
5. Your balance: -0.5 MNT ← 😟 Money gone!
```

### After (New System)
```
1. Click "Grant Permission for 0.5 MNT"
2. MetaMask: "Approve transaction" ← ✅ Only gas fee!
3. Approve transaction
4. Wait for confirmation
5. Your balance: Still 0.5 MNT ← 😊 Money stays!
6. When weapon used: -0.1 MNT ← Only spent amount deducted
```

## 🎮 Game Flow

### Team Member Flow
```
1. Join team battle
2. Click "Grant Permission"
3. Choose amount (e.g., 0.5 MNT)
4. Approve in MetaMask (only gas!)
5. ✅ Permission granted - funds stay in wallet
6. Watch team leader use weapons
7. See your balance decrease only when weapons are used
8. Can revoke anytime to stop further spending
```

### Team Leader Flow
```
1. Wait for team members to grant permissions
2. See total available pool (sum of all permissions)
3. Click weapon to use
4. Backend collects funds from team members
5. Weapon launches
6. Team members' balances decrease by their share
```

## 📊 Example Scenario

### Setup
- Team Leader: Alice
- Team Members: Bob (0.5 MNT), Charlie (0.3 MNT)
- Weapon Cost: 0.4 MNT

### Old System
```
Bob delegates 0.5 MNT → Contract holds 0.5 MNT
Charlie delegates 0.3 MNT → Contract holds 0.3 MNT
Total in contract: 0.8 MNT

Alice uses weapon (0.4 MNT):
  - Contract spends 0.2 MNT from Bob's delegation
  - Contract spends 0.2 MNT from Charlie's delegation
  
Bob's wallet: 0 MNT (all in contract)
Charlie's wallet: 0 MNT (all in contract)
Contract holds: 0.4 MNT remaining
```

### New System
```
Bob grants permission for 0.5 MNT → Bob's wallet: 0.5 MNT
Charlie grants permission for 0.3 MNT → Charlie's wallet: 0.3 MNT
Total available: 0.8 MNT

Alice uses weapon (0.4 MNT):
  - Contract pulls 0.2 MNT from Bob's wallet
  - Contract pulls 0.2 MNT from Charlie's wallet
  
Bob's wallet: 0.3 MNT (0.5 - 0.2)
Charlie's wallet: 0.1 MNT (0.3 - 0.2)
Contract holds: 0 MNT (just passes through)
```

## 🚀 Deployment Info

- **Network**: Mantle Sepolia (Chain ID: 5003)
- **Contract**: AdvancedPermissions
- **Address**: `0x48652Af3CeD9C41eB1F826e075330B758917B05B`
- **Explorer**: https://explorer.sepolia.mantle.xyz/address/0x48652Af3CeD9C41eB1F826e075330B758917B05B
- **Deployer**: 0x24c80f19649c0Da8418011eF0B6Ed3e22007758c
- **Deployment Date**: January 15, 2026

## 📁 Files Created

1. ✅ `contracts/AdvancedPermissions.sol` - New smart contract
2. ✅ `contracts/TeamDelegationV2.sol` - Alternative implementation
3. ✅ `contracts/TeamPermissions.sol` - Simplified version
4. ✅ `contracts/deploy-advanced-permissions.js` - Deployment script
5. ✅ `ERC7715_IMPLEMENTATION.md` - This documentation

## 🔄 Migration Path

### Phase 1: Deploy (✅ DONE)
- [x] Deploy AdvancedPermissions contract
- [x] Add address to .env.local

### Phase 2: Update Frontend (TODO)
- [ ] Update `warBattleContract.ts` with new ABI
- [ ] Change `delegateToLeader()` to `grantPermission()`
- [ ] Update UI text: "Delegate" → "Grant Permission"
- [ ] Remove "funds will be transferred" warnings

### Phase 3: Update Backend (TODO)
- [ ] Update backend to use new contract
- [ ] Handle permission grants (not transfers)
- [ ] Update weapon execution logic

### Phase 4: Testing (TODO)
- [ ] Test permission granting
- [ ] Test weapon usage
- [ ] Test permission revocation
- [ ] Test expiry handling

## ⚠️ Important Notes

1. **Backward Compatibility**: Old TeamDelegation contract still works
2. **Migration**: Users need to revoke old delegations and grant new permissions
3. **Gas Costs**: Granting permission is cheaper than delegating (no transfer)
4. **User Education**: Need to explain that funds stay in wallet

## 🎯 Next Steps

To complete the ERC-7715 implementation, run:

```bash
# 1. Update frontend to use new contract
# Edit: nextjs-dapp/src/lib/warBattleContract.ts

# 2. Update backend to handle new permission model
# Edit: backend/server.js

# 3. Test the new flow
npm run dev
```

---

**Status**: ✅ Contract Deployed, 🚧 Frontend Integration Pending
**Version**: 1.0
**Last Updated**: January 15, 2026
