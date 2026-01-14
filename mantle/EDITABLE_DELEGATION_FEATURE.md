# Editable Delegation Amount Feature

## Overview
Users can now delegate **any amount** they want instead of being limited to a fixed 0.1 MNT. This gives players full control over how much they want to contribute to the team pool.

## Changes Made

### 1. DelegationPage Component (`nextjs-dapp/src/components/war/DelegationPage.tsx`)

#### New State Variables
```typescript
const [delegationAmount, setDelegationAmount] = useState<string>('0.1') // Editable amount
const [balance, setBalance] = useState<string>('0') // User's wallet balance
```

#### Enhanced Wallet Check
- Now fetches and displays user's MNT balance
- Shows balance in the UI for reference
- Validates that delegation amount doesn't exceed balance

#### New UI Features

**1. Amount Input Field**
- Large, prominent input for entering custom amount
- Shows "MNT" suffix
- Validates input (must be > 0 and <= balance)
- Default value: 0.1 MNT

**2. Quick Amount Buttons**
- Pre-set amounts: 0.05, 0.1, 0.5, 1.0 MNT
- Click to instantly set that amount
- Highlighted when selected

**3. "Use Max" Button**
- Automatically fills in maximum available balance
- Leaves 0.01 MNT for gas fees
- One-click convenience

**4. Balance Display**
- Shows current wallet balance
- Updates when wallet is checked
- Format: "Your balance: X.XXXX MNT"

**5. Smart Button States**
- Disabled if amount is 0 or negative
- Disabled if amount exceeds balance
- Shows appropriate message for each state:
  - "Enter Amount to Delegate"
  - "Insufficient Balance"
  - "Delegate X MNT (Sign with MetaMask)"

#### Updated Validation
```typescript
// Validate amount before delegation
const amount = parseFloat(delegationAmount)
if (isNaN(amount) || amount <= 0) {
  setError('Please enter a valid amount greater than 0')
  return
}

const balanceNum = parseFloat(balance)
if (amount > balanceNum) {
  setError(`Insufficient balance. You have ${balance} MNT`)
  return
}
```

#### Updated Callback
```typescript
// Pass both txHash AND amount to parent
onDelegationComplete(result.txHash || '', parseFloat(delegationAmount))
```

### 2. ImprovedWarBattle Component (`nextjs-dapp/src/components/war/ImprovedWarBattle.tsx`)

#### Updated Interface
```typescript
// Now accepts amount parameter
const delegatePermission = async (txHash: string, amount: number) => {
  // Update team member with ACTUAL delegated amount
  setTeamMembers(prev => prev.map(m => 
    m.address.toLowerCase() === userAddress?.toLowerCase()
      ? { ...m, delegatedAmount: amount, isActive: true }
      : m
  ))
  
  // Send actual amount to backend
  wsRef.current.send(JSON.stringify({
    type: 'WAR_DELEGATION_COMPLETE',
    payload: {
      battleId,
      playerAddress: userAddress,
      amount: amount, // Dynamic amount!
      transactionHash: txHash
    }
  }))
}
```

### 3. Backend Compatibility (`backend/server.js`)

The backend already supports variable amounts:
- `handleWarDelegationComplete` receives `amount` from payload
- Updates `player.delegatedAmount = amount` (not hardcoded)
- Broadcasts actual amount to all team members

## User Experience

### Before (Fixed Amount)
1. User sees "Delegate 0.1 MNT" button
2. No choice - must delegate exactly 0.1 MNT
3. Can't contribute more or less

### After (Editable Amount)
1. User sees their balance: "Your balance: 2.5000 MNT"
2. Can enter any amount: 0.05, 0.1, 0.5, 1.0, or custom
3. Quick buttons for common amounts
4. "Use Max" for maximum contribution
5. Real-time validation:
   - ✅ Amount > 0
   - ✅ Amount <= balance
   - ❌ Shows error if invalid
6. Button text updates: "Delegate 0.5 MNT (Sign with MetaMask)"

## UI Layout

```
┌─────────────────────────────────────────┐
│  Transaction Details                    │
├─────────────────────────────────────────┤
│  Amount to Delegate:                    │
│  ┌───────────────────────────────────┐  │
│  │  [  0.5  ]                   MNT  │  │
│  └───────────────────────────────────┘  │
│  Your balance: 2.5000 MNT    [Use Max] │
│                                         │
│  [0.05] [0.1] [0.5] [1.0]              │
│                                         │
│  Duration: 24 hours                     │
│  Contract: TeamDelegation               │
│  Network: Mantle Sepolia                │
└─────────────────────────────────────────┘
```

## Validation Rules

1. **Minimum Amount**: > 0 MNT
2. **Maximum Amount**: <= User's balance
3. **Balance Check**: Fetched from blockchain
4. **Gas Reserve**: "Use Max" leaves 0.01 MNT for gas
5. **Number Format**: Accepts decimals (e.g., 0.001, 0.5, 1.234)

## Example Scenarios

### Scenario 1: Small Contribution
- User has 0.5 MNT
- Wants to contribute 0.05 MNT
- Clicks "0.05" quick button
- Delegates successfully

### Scenario 2: Maximum Contribution
- User has 2.5 MNT
- Clicks "Use Max"
- Amount set to 2.49 MNT (leaves 0.01 for gas)
- Delegates successfully

### Scenario 3: Custom Amount
- User has 1.0 MNT
- Types "0.75" manually
- Delegates 0.75 MNT
- Team pool increases by 0.75 MNT

### Scenario 4: Insufficient Balance
- User has 0.05 MNT
- Tries to delegate 0.1 MNT
- Button disabled: "Insufficient Balance"
- Error shown: "Insufficient balance. You have 0.05 MNT"

## Technical Details

### Balance Fetching
```typescript
const balanceWei = await window.ethereum.request({
  method: 'eth_getBalance',
  params: [userAddress, 'latest']
})
const balanceEth = parseInt(balanceWei, 16) / 1e18
setBalance(balanceEth.toFixed(4))
```

### Amount Validation
```typescript
disabled={
  !walletReady || 
  checking || 
  parseFloat(delegationAmount) <= 0 || 
  parseFloat(delegationAmount) > parseFloat(balance)
}
```

### Dynamic Text Updates
- "What happens" section: "Your {delegationAmount} MNT will be sent..."
- Success message: "You've successfully delegated {delegationAmount} MNT..."
- Agreement text: "...spend up to {delegationAmount} MNT for team weapons"

## Benefits

1. **Flexibility**: Players can contribute what they're comfortable with
2. **Accessibility**: Lower barrier to entry (can delegate 0.01 MNT)
3. **Whale Support**: High-value players can contribute more (1+ MNT)
4. **User Control**: Full autonomy over contribution amount
5. **Transparency**: See balance before deciding
6. **Convenience**: Quick buttons + Use Max for common scenarios

## Testing

### Test 1: Small Amount
1. Enter 0.01 MNT
2. Click delegate
3. Verify MetaMask shows 0.01 MNT
4. Confirm transaction
5. Check team pool increases by 0.01 MNT

### Test 2: Large Amount
1. Click "Use Max"
2. Verify amount = balance - 0.01
3. Delegate successfully
4. Check team pool shows full amount

### Test 3: Quick Buttons
1. Click each quick button (0.05, 0.1, 0.5, 1.0)
2. Verify input updates
3. Verify button highlights
4. Delegate with selected amount

### Test 4: Validation
1. Enter 0 → Button disabled
2. Enter negative → Button disabled
3. Enter > balance → Button disabled, error shown
4. Enter valid amount → Button enabled

### Test 5: Custom Amount
1. Type "0.123" manually
2. Verify button shows "Delegate 0.123 MNT"
3. Delegate successfully
4. Verify exact amount on blockchain

## Backward Compatibility

✅ **Fully Compatible**
- Backend already supports variable amounts
- Smart contracts accept any amount
- No breaking changes to existing code
- Default value (0.1 MNT) maintains familiar UX

## Future Enhancements

1. **Suggested Amounts**: Calculate based on weapon costs
2. **Team Goals**: Show "Team needs X more MNT for Nuclear Warhead"
3. **Contribution History**: Track how much each player has delegated
4. **Leaderboard**: Show top contributors
5. **Minimum Requirement**: Set minimum delegation for certain game modes

## Files Modified

1. ✅ `nextjs-dapp/src/components/war/DelegationPage.tsx`
   - Added amount input field
   - Added balance display
   - Added quick amount buttons
   - Added "Use Max" button
   - Enhanced validation
   - Updated callback signature

2. ✅ `nextjs-dapp/src/components/war/ImprovedWarBattle.tsx`
   - Updated `delegatePermission` to accept amount
   - Pass actual amount to backend
   - Update local state with actual amount

3. ✅ `backend/server.js`
   - Already supports variable amounts (no changes needed)

## Status

✅ **COMPLETE** - Feature fully implemented and ready to test!

## How to Test

1. Start backend: `cd backend && node server.js`
2. Start frontend: `cd nextjs-dapp && npm run dev`
3. Open http://localhost:3000
4. Create multiplayer room
5. Join as second player
6. Start game and select characters
7. As team member, see new delegation UI
8. Try different amounts and test all features!
