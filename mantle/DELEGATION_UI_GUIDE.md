# Delegation UI Guide - Editable Amount Feature

## 🎨 New User Interface

### Main Delegation Screen

```
╔═══════════════════════════════════════════════════════════╗
║                    🛡️ Delegate Permission                 ║
║         Join the team battle by delegating funds          ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  👑 Team Leader                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │  [Photo]  Eleven                                    │ ║
║  │           0x24c8...758c                             │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
║  📋 Transaction Details                                   ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │  Amount to Delegate:                                │ ║
║  │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │ ║
║  │  ┃         0.1                            MNT  ┃  │ ║
║  │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │ ║
║  │  Your balance: 2.5000 MNT          [Use Max]       │ ║
║  │                                                     │ ║
║  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │ ║
║  │  │ 0.05 │ │ 0.1  │ │ 0.5  │ │ 1.0  │             │ ║
║  │  └──────┘ └──────┘ └──────┘ └──────┘             │ ║
║  │                                                     │ ║
║  │  Duration: 24 hours                                │ ║
║  │  Contract: TeamDelegation                          │ ║
║  │  Network: Mantle Sepolia                           │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
║  ⚡ What happens:                                         ║
║  • Your 0.1 MNT will be sent to the smart contract       ║
║  • Team leader can spend it for team weapons             ║
║  • You can revoke permission anytime                     ║
║  • Unspent funds are refunded when you revoke            ║
║                                                           ║
║  🔒 Security:                                             ║
║  • Funds are held in audited smart contract              ║
║  • Leader can only spend delegated amount                ║
║  • Emergency revoke available anytime                    ║
║  • All transactions are on-chain and verifiable          ║
║                                                           ║
║  ✅ Wallet ready! You can proceed with delegation.       ║
║                                                           ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ║
║  ┃  🛡️ Delegate 0.1 MNT (Sign with MetaMask)         ┃ ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │        Skip (Watch Only Mode)                       │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
║  By delegating, you agree to let the team leader         ║
║  spend up to 0.1 MNT for team weapons                    ║
╚═══════════════════════════════════════════════════════════╝
```

## 🎯 Interactive Elements

### 1. Amount Input Field
- **Type**: Number input
- **Default**: 0.1
- **Min**: 0.001
- **Max**: User's balance
- **Step**: 0.001
- **Style**: Large, bold, green text
- **Validation**: Real-time

### 2. Balance Display
```
Your balance: 2.5000 MNT          [Use Max]
     ↑                                ↑
  Live balance                  Quick fill button
```

### 3. Quick Amount Buttons
```
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ 0.05 │ │ 0.1  │ │ 0.5  │ │ 1.0  │
└──────┘ └──────┘ └──────┘ └──────┘
   ↑        ↑        ↑        ↑
 Click to set amount instantly
 
 Selected button: Purple highlight
 Unselected: Gray with hover effect
```

### 4. Main Delegate Button States

#### State 1: Ready to Delegate
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🛡️ Delegate 0.5 MNT (Sign with MetaMask)         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
Green gradient, enabled, clickable
```

#### State 2: Invalid Amount (Zero)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🛡️ Enter Amount to Delegate                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
Gray, disabled, not clickable
```

#### State 3: Insufficient Balance
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🛡️ Insufficient Balance                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
Gray, disabled, not clickable
Error shown: "Insufficient balance. You have X MNT"
```

#### State 4: Checking Wallet
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🛡️ Checking Wallet...                            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
Gray, disabled, loading
```

## 📱 User Interactions

### Interaction 1: Type Custom Amount
```
User types: "0.75"
  ↓
Input updates: 0.75
  ↓
Button updates: "Delegate 0.75 MNT (Sign with MetaMask)"
  ↓
User clicks button
  ↓
MetaMask popup: "Send 0.75 MNT"
```

### Interaction 2: Use Quick Button
```
User clicks: [0.5]
  ↓
Input updates: 0.5
  ↓
Button highlights: Purple border
  ↓
Button text: "Delegate 0.5 MNT (Sign with MetaMask)"
```

### Interaction 3: Use Max
```
User balance: 2.5 MNT
  ↓
User clicks: [Use Max]
  ↓
Input updates: 2.49 (leaves 0.01 for gas)
  ↓
Button text: "Delegate 2.49 MNT (Sign with MetaMask)"
```

### Interaction 4: Insufficient Balance
```
User balance: 0.05 MNT
  ↓
User types: "0.1"
  ↓
Validation fails
  ↓
Button disabled: "Insufficient Balance"
  ↓
Error shown: "Insufficient balance. You have 0.05 MNT"
```

## 🎬 Animation Flow

### Step 1: Intro Screen (Editable Amount)
```
[Amount Input Field]
[Quick Buttons]
[Delegate Button]
```

### Step 2: Signing (After Click)
```
⏳ Waiting for Signature
Please confirm the transaction in MetaMask

Delegating to: Eleven
Amount: 0.5 MNT
```

### Step 3: Confirming
```
⏳ Confirming Transaction
Your transaction is being confirmed on the blockchain

Transaction Hash: 0x1234...
[View on Explorer]
```

### Step 4: Success
```
✅ Delegation Successful! 🎉
You've successfully delegated 0.5 MNT to your team leader

Transaction Hash: 0x1234...
[View on Explorer]

✅ Your funds are now available for team attacks
✅ You can revoke permission anytime
✅ Entering battle arena...
```

## 🎨 Color Scheme

### Input Field
- Background: Black with 70% opacity
- Border: Purple (2px, 50% opacity)
- Text: Green (#4ade80) - Large, bold
- Focus: Purple border (100% opacity)

### Quick Buttons
- Selected: Purple background (#9333ea), white text, purple border
- Unselected: Black background, gray text, gray border
- Hover: Purple border, purple text

### Use Max Button
- Text: Purple (#a855f7)
- Hover: Lighter purple (#c084fc)
- Font: Semibold, small

### Main Button
- Enabled: Green to emerald gradient
- Disabled: Gray (#374151)
- Hover: Darker green gradient + scale up
- Text: White, bold, large

## 📊 Validation Messages

### Success States
```
✅ Wallet ready! You can proceed with delegation.
✅ Amount validated: 0.5 MNT
✅ Transaction confirmed!
```

### Error States
```
❌ MetaMask not detected. Please install MetaMask extension.
❌ Wallet not connected. Please connect your MetaMask wallet.
❌ Wrong network. Please switch to Mantle Sepolia in MetaMask.
❌ Please enter a valid amount greater than 0
❌ Insufficient balance. You have 0.05 MNT
```

### Info States
```
🔄 Checking wallet status...
⏳ Waiting for signature...
⏳ Confirming transaction...
```

## 🔧 Technical Specs

### Input Validation
```typescript
// Real-time validation
disabled={
  !walletReady ||                           // Wallet not ready
  checking ||                               // Still checking
  parseFloat(delegationAmount) <= 0 ||      // Amount is 0 or negative
  parseFloat(delegationAmount) > parseFloat(balance)  // Exceeds balance
}
```

### Balance Fetching
```typescript
// Get balance from blockchain
const balanceWei = await window.ethereum.request({
  method: 'eth_getBalance',
  params: [userAddress, 'latest']
})
const balanceEth = parseInt(balanceWei, 16) / 1e18
setBalance(balanceEth.toFixed(4))
```

### Use Max Calculation
```typescript
// Leave 0.01 MNT for gas
const maxAmount = Math.max(0, parseFloat(balance) - 0.01)
setDelegationAmount(maxAmount.toFixed(4))
```

## 🎯 User Experience Goals

1. **Clarity**: User always knows their balance and limits
2. **Flexibility**: Can delegate any amount they want
3. **Convenience**: Quick buttons for common amounts
4. **Safety**: Validation prevents mistakes
5. **Transparency**: Real-time feedback on all actions
6. **Speed**: One-click options for common scenarios

## 📱 Responsive Design

- Mobile: Stacked layout, full-width buttons
- Tablet: Same as mobile with more padding
- Desktop: Centered modal, max-width 2xl

## ♿ Accessibility

- Input has proper labels
- Buttons have descriptive text
- Error messages are clear and actionable
- Color contrast meets WCAG standards
- Keyboard navigation supported

## 🚀 Performance

- Balance fetched once on mount
- Real-time validation (no API calls)
- Instant UI updates
- Smooth animations (Framer Motion)

---

**Status**: ✅ Fully Implemented
**Version**: 1.0
**Last Updated**: January 2026
