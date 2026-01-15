# ERC-20 Permission System - TRUE ERC-7715 Style! 🎉

## What You Wanted:
- ✅ Grant permission = Just sign, NO money sent upfront
- ✅ Money stays in player's wallet
- ✅ When weapon vote passes, THEN money is deducted
- ✅ No signature needed per weapon
- ✅ Spending cap enforced

## How We Achieved It:

### Using ERC-20 Approval Pattern (Like USDC/USDT)

1. **WMANTLE Token** - Wrap native MNT into ERC-20
2. **ERC20Permissions Contract** - Uses approval to pull funds

---

## System Architecture

```
Player's Wallet
    ↓
1. Wrap: 1 MNT → 1 WMANTLE (ERC-20 token)
    ↓
2. Approve: WMANTLE.approve(ERC20Permissions, 0.1 WMANTLE)
    ↓
3. Grant Permission: Set spending cap (NO MONEY SENT!)
    ↓
4. Weapon Vote Passes
    ↓
5. Backend calls executeTeamAction()
    ↓
6. Contract PULLS WMANTLE from wallet (using approval)
    ↓
7. Backend receives WMANTLE as payment
```

---

## Contracts

### 1. WMANTLE.sol - Wrapped Mantle Token
```solidity
// Wrap MNT to WMANTLE
function deposit() external payable

// Unwrap WMANTLE to MNT
function withdraw(uint256 amount) external
```

### 2. ERC20Permissions.sol - Permission Management
```solidity
// Grant permission (NO MONEY SENT!)
function grantPermission(address delegate, uint256 maxAmount, uint256 duration)

// Execute team action (PULLS money from wallets)
function executeTeamAction(address[] owners, uint256[] amounts)

// Revoke permission
function revokePermission(address delegate)
```

---

## Player Flow (Frontend)

### Step 1: Wrap MNT to WMANTLE
```typescript
// Player clicks "Wrap MNT"
const WMANTLE = new ethers.Contract(WMANTLE_ADDRESS, WMANTLE_ABI, signer)
const tx = await WMANTLE.deposit({ value: ethers.parseEther("0.1") })
await tx.wait()
// Player now has 0.1 WMANTLE in wallet
```

### Step 2: Approve Contract
```typescript
// Player clicks "Approve Spending"
const tx = await WMANTLE.approve(
  ERC20_PERMISSIONS_ADDRESS,
  ethers.parseEther("0.1")
)
await tx.wait()
// Contract can now pull up to 0.1 WMANTLE from player's wallet
```

### Step 3: Grant Permission
```typescript
// Player clicks "Grant Permission"
const ERC20Permissions = new ethers.Contract(
  ERC20_PERMISSIONS_ADDRESS,
  ERC20_PERMISSIONS_ABI,
  signer
)
const tx = await ERC20Permissions.grantPermission(
  BACKEND_WALLET,
  ethers.parseEther("0.1"), // Max spending cap
  86400 // 24 hours
)
await tx.wait()
// Permission granted! NO MONEY SENT!
```

### Step 4: Weapon Launch (Automatic!)
```typescript
// Backend calls this after vote passes
// NO player signature needed!
const tx = await ERC20Permissions.executeTeamAction(
  [player1Address, player2Address],
  [ethers.parseEther("0.003"), ethers.parseEther("0.003")]
)
await tx.wait()
// Contract automatically pulls 0.003 WMANTLE from each player's wallet
// Backend receives 0.006 WMANTLE total
```

---

## Backend Changes Needed

### Update `backend/server.js`:

```javascript
// OLD: Used TeamDelegation contract
const teamDelegationContract = new ethers.Contract(
  TEAM_DELEGATION_ADDRESS,
  TEAM_DELEGATION_ABI,
  agentWallet
)

// NEW: Use ERC20Permissions contract
const erc20PermissionsContract = new ethers.Contract(
  process.env.ERC20_PERMISSIONS_ADDRESS,
  [
    "function executeTeamAction(address[] calldata owners, uint256[] calldata amounts) external"
  ],
  agentWallet
)

// Execute weapon launch
const owners = spending.map(s => s.address)
const amounts = spending.map(s => ethers.parseEther(s.amount.toString()))

const tx = await erc20PermissionsContract.executeTeamAction(owners, amounts)
// Contract pulls WMANTLE from players' wallets automatically!
```

---

## Deployment

```bash
# Deploy contracts
npx hardhat run scripts/deploy-erc20-system.js --network mantleSepolia

# Output:
# WMANTLE: 0x...
# ERC20Permissions: 0x...
```

---

## Benefits

### ✅ Money Stays in Wallet
- Player wraps to WMANTLE
- WMANTLE stays in player's wallet
- Only pulled when weapon is used

### ✅ One-Time Approval
- Player approves once
- No signature per weapon
- Backend can execute gaslessly

### ✅ Spending Cap Enforced
- Player sets max (e.g., 0.1 WMANTLE)
- Contract tracks spent amount
- Cannot exceed cap

### ✅ Easy Revoke
- Player calls `revokePermission()`
- Unspent WMANTLE stays in wallet
- No refund needed!

### ✅ Can Increase Cap
- Player can approve more anytime
- Call `increasePermission()`
- Adds to existing cap

---

## Comparison

### OLD (TeamDelegation):
```
❌ Player sends 0.1 MNT to contract upfront
❌ Money locked in contract
✅ Backend can spend without signature
❌ Need refund when revoked
```

### NEW (ERC20Permissions):
```
✅ Player just approves (NO money sent!)
✅ Money stays in wallet
✅ Backend can spend without signature
✅ No refund needed - money never left!
```

---

## Frontend Changes Needed

### 1. Add WMANTLE Wrapping UI
```tsx
<button onClick={wrapMNT}>
  Wrap {amount} MNT → WMANTLE
</button>
```

### 2. Add Approval Step
```tsx
<button onClick={approveContract}>
  Approve Contract to Spend WMANTLE
</button>
```

### 3. Update Grant Permission
```tsx
// OLD: Sent MNT with transaction
const tx = await contract.delegateToLeader(leader, duration, {
  value: ethers.parseEther(amount)
})

// NEW: Just grant permission (NO value!)
const tx = await contract.grantPermission(
  backend,
  ethers.parseEther(amount),
  duration
  // NO { value: ... }
)
```

---

## Testing

### 1. Wrap MNT:
```bash
# Player wraps 0.1 MNT
WMANTLE.deposit{value: 0.1 ether}()
# Check: Player has 0.1 WMANTLE in wallet
```

### 2. Approve:
```bash
# Player approves contract
WMANTLE.approve(ERC20Permissions, 0.1 ether)
# Check: allowance(player, contract) = 0.1 WMANTLE
```

### 3. Grant Permission:
```bash
# Player grants permission
ERC20Permissions.grantPermission(backend, 0.1 ether, 86400)
# Check: permission.maxAmount = 0.1, permission.spent = 0
```

### 4. Launch Weapon:
```bash
# Backend executes
ERC20Permissions.executeTeamAction([player1, player2], [0.003, 0.003])
# Check: 
# - player1 WMANTLE balance decreased by 0.003
# - player2 WMANTLE balance decreased by 0.003
# - backend WMANTLE balance increased by 0.006
# - permission.spent = 0.003 for each player
```

---

## Summary

This is **TRUE ERC-7715 style** using ERC-20 approval pattern:
- ✅ Money stays in wallet
- ✅ One-time approval
- ✅ Automatic deduction when weapon used
- ✅ Spending cap enforced
- ✅ No refund needed

**Exactly what you wanted!** 🎉
