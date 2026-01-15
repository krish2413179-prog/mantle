# WMANTLE as Game Currency - Simplified System

## Overview
Removed delegation completely! WMANTLE is now used as in-game currency with real-time deduction from player wallets.

## How It Works

### 1. One-Time Setup (Before Playing)
Players visit `/wallet-setup` page and complete 2 simple steps:

**Step 1: Wrap MNT → WMANTLE**
- Convert native MNT to WMANTLE (ERC-20 token)
- WMANTLE stays in player's wallet
- Shows as balance in wallet

**Step 2: Approve Contract**
- One-time approval for game contract
- Allows contract to spend WMANTLE
- No money sent - just permission granted

### 2. During Game
- **No delegation needed!**
- Players just play the game
- When weapon vote passes → WMANTLE automatically deducted from each player's wallet
- Backend calls `purchaseWeapon()` which pulls WMANTLE in real-time

### 3. Benefits
- ✅ No delegation page
- ✅ No permission caps
- ✅ Money stays in wallet until weapon used
- ✅ Real-time deduction
- ✅ Simple 2-step setup
- ✅ Backend pays gas fees

## Smart Contracts

### SimpleGamePayment Contract
**Address:** `0xD2c30a46Ac468F67f7C2eb7Bd60bf33b6Cfb388b`

```solidity
function purchaseWeapon(
    address[] calldata players,
    uint256 costPerPlayer
) external
```

**What it does:**
- Pulls WMANTLE from each player's wallet
- Transfers total to backend (leader)
- Emits events for tracking

### WMANTLE Contract
**Address:** `0x157695Bd2966FBC0EE8440a7D60D9F8993AE7850`

Standard ERC-20 wrapped token:
- `deposit()` - Wrap MNT → WMANTLE
- `withdraw()` - Unwrap WMANTLE → MNT
- `approve()` - Allow contract to spend
- `balanceOf()` - Check balance

## Frontend Flow

### Wallet Setup Page (`/wallet-setup`)
1. Shows current balances (MNT, WMANTLE, Allowance)
2. Step 1: Input amount → Wrap MNT
3. Step 2: Approve contract (unlimited)
4. Setup complete → Redirect to battle

### War Battle Page
- No delegation UI needed
- Just show WMANTLE balance
- When weapon launches → automatic deduction

## Backend Changes

### Environment Variables
```bash
WMANTLE_ADDRESS=0x157695Bd2966FBC0EE8440a7D60D9F8993AE7850
GAME_PAYMENT_ADDRESS=0xD2c30a46Ac468F67f7C2eb7Bd60bf33b6Cfb388b
```

### Weapon Launch Logic
```javascript
// When weapon vote passes
const gamePaymentContract = new ethers.Contract(
    process.env.GAME_PAYMENT_ADDRESS,
    ["function purchaseWeapon(address[] calldata players, uint256 costPerPlayer) external"],
    agentWallet
);

const players = teamMembers.map(m => m.address);
const costPerPlayer = ethers.parseEther("0.0005"); // 0.0005 WMANTLE per player

// Pull WMANTLE from all players
await gamePaymentContract.purchaseWeapon(players, costPerPlayer);
```

## Comparison: Old vs New

| Feature | Old (Delegation) | New (Game Currency) |
|---------|------------------|---------------------|
| Setup Steps | 3 (wrap, approve, grant) | 2 (wrap, approve) |
| Permission Caps | Yes, per player | No caps needed |
| Delegation Page | Required | Removed! |
| Money Location | Wallet | Wallet |
| Deduction | Real-time | Real-time |
| Complexity | High | Low |
| User Experience | Complex | Simple |

## Testing

### 1. Setup Wallet
```
Visit: http://localhost:3002/wallet-setup
1. Connect wallet
2. Wrap 0.01 MNT → WMANTLE
3. Approve contract
4. See "Setup Complete" ✅
```

### 2. Play Game
```
Visit: http://localhost:3002/war-battle
1. Create/join room
2. Propose weapon
3. Vote yes
4. WMANTLE deducted automatically!
```

### 3. Verify Transaction
```
Check explorer: https://explorer.sepolia.mantle.xyz/
- See WMANTLE transfers from players to backend
- Event: WeaponPurchased
- Event: PaymentCollected (per player)
```

## Contract Deployment

```bash
npx hardhat run scripts/deploy-simple-game.js --network mantle-sepolia
```

**Deployed:**
- WMANTLE: `0x157695Bd2966FBC0EE8440a7D60D9F8993AE7850` (existing)
- SimpleGamePayment: `0xD2c30a46Ac468F67f7C2eb7Bd60bf33b6Cfb388b` (new)

## Files Changed

### Contracts
- ✅ `contracts/SimpleGamePayment.sol` - New simplified contract
- ✅ `scripts/deploy-simple-game.js` - Deployment script

### Backend
- ✅ `backend/.env` - Updated contract address
- ✅ `backend/server.js` - Updated to use SimpleGamePayment

### Frontend
- ✅ `nextjs-dapp/.env.local` - Updated contract address
- ✅ `nextjs-dapp/src/components/war/WalletSetupPage.tsx` - New setup page
- ✅ `nextjs-dapp/src/app/wallet-setup/page.tsx` - Route

## Next Steps

1. ✅ Deploy SimpleGamePayment contract
2. ✅ Update backend to use new contract
3. ✅ Create wallet setup page
4. ⏳ Test complete flow
5. ⏳ Remove old delegation page
6. ⏳ Update navigation to show wallet setup

## Notes

- WMANTLE is ERC-20 token (like USDC/USDT)
- Cannot use native MNT directly (no `approve()` function)
- Wrapping is necessary for ERC-20 approval pattern
- This is the standard way all DeFi apps work
- One-time setup, then seamless gameplay!
