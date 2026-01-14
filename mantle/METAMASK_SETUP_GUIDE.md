# 🦊 MetaMask Advanced Permissions Setup for Ghost-Pay

Complete guide to configure MetaMask for EIP-7702 Ghost-Pay delegation on Mantle Sepolia.

## 🎯 **Overview**

Ghost-Pay uses **EIP-7702 Account Abstraction** to enable seamless gaming experiences by allowing an AI Agent to execute transactions on behalf of players without constant MetaMask popups.

## 📋 **Prerequisites**

### **Required Software**
- **MetaMask Browser Extension** (latest version)
- **Modern Web Browser** (Chrome, Firefox, Edge, Safari)
- **Mantle Sepolia Testnet** configured
- **Test MNT tokens** for transactions

### **Network Configuration**
- **Chain ID**: 5003 (0x138B in hex)
- **RPC URL**: https://rpc.sepolia.mantle.xyz
- **Currency**: MNT
- **Explorer**: https://sepolia.mantlescan.xyz/

## 🔧 **Step 1: Install & Configure MetaMask**

### **Install MetaMask**
1. Visit [metamask.io](https://metamask.io)
2. Download browser extension
3. Create new wallet or import existing
4. Secure your seed phrase

### **Add Mantle Sepolia Network**
```javascript
// Network Details
Chain ID: 5003
Network Name: Mantle Sepolia Testnet
RPC URL: https://rpc.sepolia.mantle.xyz
Currency Symbol: MNT
Block Explorer: https://sepolia.mantlescan.xyz/
```

**Manual Addition:**
1. Open MetaMask
2. Click network dropdown
3. Select "Add Network"
4. Enter details above
5. Save network

## ⚡ **Step 2: Ghost-Pay Setup Process**

### **Automatic Setup (Recommended)**
The DApp will guide you through the setup:

1. **Connect Wallet** - Click "Connect Wallet" in the game
2. **Network Switch** - Approve switch to Mantle Sepolia
3. **Advanced Permissions** - Grant signing permissions
4. **EIP-7702 Delegation** - Sign delegation authorization
5. **Confirmation** - Setup complete!

### **Manual Setup (Advanced Users)**

**JavaScript Console Method:**
```javascript
// Open browser console (F12)
// Run the following commands:

// 1. Check MetaMask availability
console.log('MetaMask available:', typeof window.ethereum !== 'undefined');

// 2. Request account access
const accounts = await window.ethereum.request({
  method: 'eth_requestAccounts'
});
console.log('Connected account:', accounts[0]);

// 3. Switch to Mantle Sepolia
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x138B' }]
});

// 4. Request advanced permissions
await window.ethereum.request({
  method: 'wallet_requestPermissions',
  params: [{ eth_accounts: {} }]
});

// 5. Setup EIP-7702 delegation
const userAddress = accounts[0];
const result = await window.GhostPaySetup.completeSetup(userAddress);
console.log('Setup result:', result);
```

## 🔐 **Step 3: EIP-7702 Delegation Details**

### **What Gets Signed**
```json
{
  "types": {
    "EIP712Domain": [
      {"name": "name", "type": "string"},
      {"name": "version", "type": "string"},
      {"name": "chainId", "type": "uint256"}
    ],
    "Authorization": [
      {"name": "chainId", "type": "uint256"},
      {"name": "address", "type": "address"},
      {"name": "nonce", "type": "uint256"}
    ]
  },
  "primaryType": "Authorization",
  "domain": {
    "name": "Ghost-Pay Delegation",
    "version": "1",
    "chainId": 5003
  },
  "message": {
    "chainId": 5003,
    "address": "0x2d84813B18a5d601A4ddc7153Ae44848Ff824D7A",
    "nonce": "USER_CURRENT_NONCE"
  }
}
```

### **Contract Addresses**
- **Ghost Delegate**: `0x2d84813B18a5d601A4ddc7153Ae44848Ff824D7A`
- **AI Agent**: `0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081`
- **Game Registry**: `0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A`

## 🛡️ **Security Considerations**

### **What You're Authorizing**
- ✅ **Game Actions Only** - Limited to specific game contracts
- ✅ **Temporary Delegation** - 24-hour expiration
- ✅ **Revocable** - Can be cancelled anytime
- ✅ **No Asset Access** - Cannot move your tokens/NFTs

### **What You're NOT Authorizing**
- ❌ **Full Wallet Control** - Agent cannot access all funds
- ❌ **Arbitrary Transactions** - Limited to game functions
- ❌ **Permanent Access** - Delegation expires automatically
- ❌ **Private Key Access** - Your keys remain secure

### **Safety Features**
- **Nonce-based Security** - Prevents replay attacks
- **Contract Whitelisting** - Only approved contracts accessible
- **Time Limits** - Automatic expiration
- **User Revocation** - Cancel anytime through MetaMask

## 🔍 **Step 4: Verification**

### **Check Setup Status**
```javascript
// In browser console
const userAddress = 'YOUR_WALLET_ADDRESS';
const isActive = window.GhostPaySetup.isDelegationActive(userAddress);
console.log('Ghost-Pay active:', isActive);

const info = window.GhostPaySetup.getDelegationInfo(userAddress);
console.log('Delegation info:', info);
```

### **Visual Indicators**
- 🟢 **Green Badge** - "👻 GHOST-PAY ACTIVE"
- ⚙️ **Settings Icon** - Access Ghost-Pay configuration
- 📊 **Battle Logs** - Real-time transaction confirmations

## 🚨 **Troubleshooting**

### **Common Issues**

**"MetaMask not found"**
```bash
Solution: Install MetaMask browser extension
URL: https://metamask.io/download/
```

**"Wrong network"**
```bash
Solution: Switch to Mantle Sepolia
Chain ID: 5003
RPC: https://rpc.sepolia.mantle.xyz
```

**"Insufficient funds"**
```bash
Solution: Get test MNT tokens
Faucet: https://faucet.sepolia.mantle.xyz/
```

**"Signature failed"**
```bash
Solution: 
1. Refresh page
2. Clear MetaMask cache
3. Try setup again
```

**"Delegation expired"**
```bash
Solution: Re-run setup process
Delegations expire after 24 hours
```

### **Reset Instructions**
```javascript
// Clear stored delegation
const userAddress = 'YOUR_WALLET_ADDRESS';
localStorage.removeItem(`ghostpay_delegation_${userAddress.toLowerCase()}`);

// Refresh page and setup again
location.reload();
```

## 📱 **Mobile Setup**

### **MetaMask Mobile**
1. Install MetaMask mobile app
2. Import your wallet
3. Add Mantle Sepolia network
4. Open DApp in MetaMask browser
5. Follow same setup process

### **WalletConnect (Alternative)**
- Connect via WalletConnect
- Use any compatible mobile wallet
- Same delegation process applies

## 🔄 **Maintenance**

### **Regular Tasks**
- **Renew Delegation** - Every 24 hours if actively gaming
- **Check Network** - Ensure Mantle Sepolia is selected
- **Monitor Balance** - Keep some MNT for emergency transactions

### **Security Practices**
- **Regular Reviews** - Check active permissions monthly
- **Revoke Unused** - Cancel delegations for unused DApps
- **Update MetaMask** - Keep extension updated
- **Backup Seed** - Secure your recovery phrase

## 🎮 **Gaming Experience**

### **With Ghost-Pay**
- ✅ **Instant Actions** - No transaction popups
- ✅ **Smooth Gameplay** - Uninterrupted gaming flow
- ✅ **Gas-Free** - AI Agent covers transaction costs
- ✅ **Real-time Updates** - Immediate visual feedback

### **Without Ghost-Pay**
- ❌ **Constant Popups** - MetaMask approval for every action
- ❌ **Broken Flow** - Game pauses for transactions
- ❌ **Gas Costs** - Player pays for each transaction
- ❌ **Delays** - 3-15 second confirmation times

## 📞 **Support**

### **Getting Help**
- **In-Game Support** - Use the settings icon in the DApp
- **Discord Community** - Join our gaming community
- **GitHub Issues** - Report technical problems
- **Documentation** - Check the full setup guide

### **Emergency Procedures**
- **Revoke Permissions** - MetaMask → Settings → Permissions
- **Reset Wallet** - Clear cache and reconnect
- **Contact Support** - Discord or GitHub for urgent issues

---

**Ready to experience the future of blockchain gaming with Ghost-Pay! 🎮⚡👻**