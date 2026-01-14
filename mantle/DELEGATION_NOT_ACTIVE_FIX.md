# 🔧 Fix: "Delegation not active" Error

## ❌ The Error You're Seeing

```
Error: execution reverted: "Delegation not active"
```

This means the smart contract on Mantle Sepolia blockchain **cannot find an active delegation** from the team member to the team leader.

## 🔍 Root Causes

### 1. Delegation Transaction Not Completed ⚠️
**Most Common Issue:**
- Team member clicked "Delegate 0.1 MNT"
- MetaMask popup appeared
- But transaction was:
  - ❌ Rejected/Cancelled
  - ❌ Still pending (not confirmed)
  - ❌ Failed due to insufficient gas

**How to Check:**
1. Open browser console (F12)
2. Look for delegation logs:
   ```
   ✅ Step 4 complete: Transaction confirmed!
   ✅ Permission delegated! Block: 12345
   ```
3. If you don't see "Transaction confirmed", the delegation didn't complete

### 2. Wrong Leader Address
- Backend might be using different leader address than expected
- Room host detection issue

### 3. Network Issues
- Transaction sent but not confirmed yet
- Blockchain congestion

## ✅ Solution Steps

### Step 1: Verify Delegation Status (Team Leader)

**In the battle screen:**
1. Look for the **"🔍 Verify Delegations"** button (top right of Arsenal section)
2. Click it
3. You'll see a popup showing:
   ```
   Delegation Status:
   
   0x24c8...758c
     Active: ✅
     Available: 0.1 MNT
   
   0xCb18...f268
     Active: ❌
     Available: 0 MNT
   
   Total Active: 1/2
   ```

**What this means:**
- ✅ = Delegation exists on blockchain
- ❌ = No delegation found (team member needs to delegate)

### Step 2: Team Member Must Complete Delegation

**If delegation shows ❌, team member needs to:**

1. **Refresh the page** (important!)
2. **Rejoin the battle**
3. **See the Delegation Page again**
4. **Check wallet status:**
   - ✅ Green box = Ready to delegate
   - ❌ Red box = Fix the issue shown

5. **Click "Delegate 0.1 MNT"**
6. **MetaMask popup MUST appear** 🦊
7. **Click "Confirm" in MetaMask**
8. **Wait for confirmation** (watch console logs):
   ```
   📍 Step 3: Sending transaction to MetaMask...
   ⚠️ PLEASE CHECK YOUR METAMASK - A popup should appear now!
   ✅ Step 3 complete: Transaction signed!
   ⏳ Transaction sent: 0x...
   📍 Step 4: Waiting for blockchain confirmation...
   ✅ Step 4 complete: Transaction confirmed!
   ```

9. **MUST see "Transaction confirmed!"** - This is critical!

### Step 3: Verify On Blockchain Explorer

**After delegation completes:**
1. Copy transaction hash from console
2. Visit: https://explorer.sepolia.mantle.xyz
3. Paste transaction hash
4. Check:
   - Status: ✅ Success
   - From: Team member's address
   - To: `0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4` (TeamDelegation)
   - Value: 0.1 MNT

### Step 4: Try Weapon Launch Again

**After confirming delegation is active:**
1. Team leader clicks weapon
2. System will now verify delegations on-chain first
3. Console will show:
   ```
   🔍 Step 1: Verifying delegations on-chain...
   ✅ Found 2 active delegations on-chain
   🚀 Step 2: Executing REAL blockchain transaction...
   ```
4. MetaMask popup appears for leader
5. Approve → Weapon launches successfully!

## 🐛 Debugging Checklist

### For Team Members (Non-Leader):
- [ ] MetaMask installed and unlocked
- [ ] Connected to Mantle Sepolia (Chain ID 5003)
- [ ] Have at least 0.15 MNT (0.1 + gas)
- [ ] Clicked "Delegate 0.1 MNT" button
- [ ] MetaMask popup appeared
- [ ] Clicked "Confirm" in MetaMask
- [ ] Saw "Transaction confirmed!" in console
- [ ] Transaction visible on explorer with "Success" status

### For Team Leader:
- [ ] Clicked "🔍 Verify Delegations" button
- [ ] All team members show "Active: ✅"
- [ ] Available amounts > 0 MNT
- [ ] Trying to launch weapon that costs less than total pool

## 🔧 Advanced Debugging

### Check Delegation Directly in Console

**Team member can check their own delegation:**
```javascript
// In browser console (F12)
const { checkDelegation } = await import('/src/lib/warBattleContract.ts')

// Replace with actual addresses
const myAddress = '0xCb188D3DBAb64D9B01c6B49193F76d762a00f268'
const leaderAddress = '0x24c80f19649c0Da8418011eF0B6Ed3e22007758c'

const status = await checkDelegation(myAddress, leaderAddress)
console.log('My delegation status:', status)
```

**Expected output if delegation is active:**
```javascript
{
  amount: "0.1",
  expiry: 1736938492,
  spent: "0",
  active: true,
  available: "0.1"
}
```

**If delegation is NOT active:**
```javascript
{
  amount: "0",
  expiry: 0,
  spent: "0",
  active: false,
  available: "0"
}
```

## 🎯 Common Scenarios

### Scenario 1: "I clicked delegate but nothing happened"
**Solution:**
- Check if MetaMask popup appeared (might be hidden behind window)
- Check MetaMask extension icon for pending transaction
- Look for errors in browser console
- Try refreshing page and delegating again

### Scenario 2: "MetaMask popup appeared but I rejected it"
**Solution:**
- Refresh page
- Rejoin battle
- Click "Delegate 0.1 MNT" again
- This time click "Confirm" in MetaMask

### Scenario 3: "Transaction is pending for a long time"
**Solution:**
- Wait 1-2 minutes for Mantle Sepolia confirmation
- Check transaction on explorer
- If stuck, try speeding up transaction in MetaMask
- Or cancel and try again with higher gas

### Scenario 4: "Leader sees pool but can't launch weapons"
**Solution:**
- Backend pool might be out of sync with blockchain
- Click "🔍 Verify Delegations" to check on-chain status
- If shows ❌, team member needs to delegate again
- If shows ✅, try launching weapon again

## 📊 What Changed to Fix This

### New Features Added:

1. **On-Chain Verification Before Spending**
   - System now checks blockchain BEFORE attempting weapon launch
   - Prevents "Delegation not active" errors
   - Shows clear error if delegations missing

2. **Verify Delegations Button**
   - Team leader can check delegation status anytime
   - Shows which members have active delegations
   - Displays available amounts

3. **Better Error Messages**
   - Clear instructions when delegation not found
   - Step-by-step guidance for team members
   - Links to check transactions on explorer

4. **Comprehensive Logging**
   - Every step logged to console
   - Easy to see where process fails
   - Transaction hashes for verification

## 🚀 Testing the Fix

### Test Flow:
1. **Team member delegates:**
   - Click "Delegate 0.1 MNT"
   - Approve in MetaMask
   - Wait for "Transaction confirmed!" message
   - Copy transaction hash

2. **Verify on explorer:**
   - Paste hash at https://explorer.sepolia.mantle.xyz
   - Confirm status is "Success"

3. **Leader verifies:**
   - Click "🔍 Verify Delegations"
   - Confirm member shows "Active: ✅"

4. **Launch weapon:**
   - Click weapon card
   - System verifies delegations first
   - MetaMask popup appears
   - Approve → Success!

## 📞 Still Getting Error?

**If you still see "Delegation not active" after following all steps:**

1. **Share these details:**
   - Team member address
   - Team leader address
   - Delegation transaction hash
   - Weapon launch transaction hash (if attempted)
   - Browser console logs

2. **Check contract directly:**
   - Visit: https://explorer.sepolia.mantle.xyz/address/0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4
   - Click "Read Contract"
   - Use `getDelegation` function with member and leader addresses
   - See what blockchain returns

3. **Verify addresses match:**
   - Backend might be using different leader address
   - Check backend logs for "Team leader:" address
   - Compare with address shown in UI

---

**The key is: Delegation MUST be confirmed on blockchain before weapons can be launched!**

Check the "🔍 Verify Delegations" button to see real-time on-chain status.
