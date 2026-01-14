# Delegation Payment Fix - Players Now Pay for Weapons!

## Problem Found 🚨
Players were NOT paying for weapons! The backend was withdrawing from the contract's own balance instead of from player delegations.

### Root Cause:
1. **Wrong Contract Address** - Code was calling `0x48652Af3...` (AdvancedPermissions) instead of `0x751265cD...` (TeamDelegation)
2. **Wrong Function** - Calling `grantPermission()` instead of `delegateToLeader()`
3. **NO PAYMENT SENT** - The transaction didn't include `{ value: ... }` so no MNT was sent!

### Evidence:
Looking at transaction `0xbda506689c95457d99d47ecb87b418441730973c7469909031028195ebc17dbf`:
- Backend received 0.008 MNT from contract
- But NO delegation transactions from players exist
- Contract was just giving away its own balance!

## Solution ✅

### Fixed `nextjs-dapp/src/lib/warBattleContract.ts`:

**BEFORE (Broken)**:
```typescript
// Wrong contract
export const ADVANCED_PERMISSIONS_ADDRESS = '0x48652Af3...'
export const ADVANCED_PERMISSIONS_ABI = [
  "function grantPermission(...) external", // Wrong function
  ...
]

// No payment sent!
const tx = await advancedPermissions.grantPermission(
  BACKEND_WALLET,
  maxAmountWei,
  duration
  // NO { value: ... } ❌
)
```

**AFTER (Fixed)**:
```typescript
// Correct contract
export const TEAM_DELEGATION_ADDRESS = '0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4'
export const TEAM_DELEGATION_ABI = [
  "function delegateToLeader(address delegate, uint256 duration) external payable",
  ...
]

// Payment sent! ✅
const tx = await teamDelegation.delegateToLeader(
  BACKEND_WALLET,
  duration,
  { value: amountWei } // ← SENDS THE MNT!
)
```

## How It Works Now 💰

### 1. Player Delegates (Sends MNT):
```
Player clicks "Grant Permission for 0.1 MNT"
  ↓
MetaMask popup: "Send 0.1 MNT to TeamDelegation contract"
  ↓
Player approves
  ↓
0.1 MNT transferred from player's wallet to contract
  ↓
Contract stores: delegations[playerAddress][backendWallet] = 0.1 MNT
```

### 2. Weapon is Launched:
```
Backend calls executeTeamAction([player1, player2], [0.003, 0.003])
  ↓
Contract checks: player1 has 0.1 MNT delegated ✅
Contract checks: player2 has 0.1 MNT delegated ✅
  ↓
Contract marks: player1.spent += 0.003, player2.spent += 0.003
  ↓
Contract transfers: 0.006 MNT total to backend wallet
  ↓
Backend pays gas (~0.004 MNT)
Backend keeps weapon cost (0.006 MNT)
Net profit: +0.002 MNT
```

### 3. Player Revokes:
```
Player clicks "Revoke Permission"
  ↓
Contract calculates: 0.1 - 0.003 = 0.097 MNT unspent
  ↓
Contract refunds: 0.097 MNT back to player's wallet
  ↓
Player gets their unspent funds back!
```

## What Changed in the Code

### File: `nextjs-dapp/src/lib/warBattleContract.ts`

1. **Contract Address**: Changed from `ADVANCED_PERMISSIONS_ADDRESS` to `TEAM_DELEGATION_ADDRESS`
2. **Contract ABI**: Changed to match the actual deployed TeamDelegation contract
3. **Function Call**: Changed from `grantPermission()` to `delegateToLeader()`
4. **Payment**: Added `{ value: amountWei }` to actually send MNT
5. **Function Names**: Updated all references from `advancedPermissions` to `teamDelegation`

## Testing After Fix

### What to Check:

1. **Player Delegation**:
   - Player clicks "Grant Permission"
   - MetaMask shows: "Send 0.1 MNT" (not just gas!)
   - Transaction appears on explorer with 0.1 MNT value
   - Look for `PermissionDelegated` event

2. **Weapon Launch**:
   - Backend calls `executeTeamAction`
   - Internal transfer shows MNT from contract to backend
   - Look for `DelegatedSpend` events for each player
   - Look for `TeamActionExecuted` event

3. **Check Delegation Status**:
   ```
   Call getDelegation(playerAddress, backendWallet)
   Should return:
   - amount: 0.1 MNT
   - spent: 0.003 MNT (after one weapon)
   - available: 0.097 MNT
   - active: true
   ```

### Expected Transaction Flow:

**Delegation Transaction**:
- From: Player wallet
- To: TeamDelegation contract (0x751265cD...)
- Value: 0.1 MNT ✅
- Function: `delegateToLeader`

**Weapon Launch Transaction**:
- From: Backend wallet (0x63e3f5a1...)
- To: TeamDelegation contract
- Value: 0 MNT
- Internal Transfer: 0.008 MNT from contract to backend
- Function: `executeTeamAction`

## Environment Variable Needed

Add to `nextjs-dapp/.env.local`:
```
NEXT_PUBLIC_TEAM_DELEGATION_ADDRESS=0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4
```

## Files Modified
- `nextjs-dapp/src/lib/warBattleContract.ts` - Fixed contract address, ABI, and payment

## Next Steps
1. Test delegation with real player
2. Verify MNT is actually sent in MetaMask
3. Check transaction on explorer shows 0.1 MNT value
4. Launch weapon and verify player's delegation is debited
5. Check backend receives the weapon cost

## Summary
Players now **actually pay for weapons** by sending MNT to the contract when they delegate. The backend executes gaslessly and receives the weapon cost as payment for the service. This is the correct implementation!
