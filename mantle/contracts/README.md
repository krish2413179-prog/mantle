# Ghost-Pay Smart Contracts

This directory contains the smart contracts for the Ghost-Pay system, which enables seamless blockchain gaming through EIP-7702 delegation.

## Contracts Overview

### 1. GameRegistry.sol
The main game logic contract that manages player state, items, and rewards. This contract:
- Stores player stats (gold, experience, level, inventory)
- Handles item minting and reward distribution
- Supports batch operations for gas efficiency
- Emits events for indexing and monitoring
- Uses standard `msg.sender` - doesn't know about EIP-7702

**Key Functions:**
- `claimReward(itemId, goldReward)` - Award items and gold to players
- `mintItem(itemId, quantity)` - Mint specific items to player inventory
- `gainExperience(expAmount)` - Award experience points with automatic leveling
- `updatePlayerState(level, exp, goldChange)` - Comprehensive state updates
- `batchClaimRewards(...)` - Gas-efficient batch operations

### 2. GhostSessionDelegate.sol
The delegation contract that gets "pasted" onto player EOAs via EIP-7702. This contract:
- Validates AI Agent authorization
- Manages delegation sessions with spending limits and expiration
- Executes game actions on behalf of players
- Provides security controls and emergency functions
- Supports batch operations

**Key Functions:**
- `initializeSession(maxSpendLimit, duration)` - Set up delegation session
- `executeGameAction(targetContract, data)` - Execute single game action
- `batchExecuteGameActions(...)` - Execute multiple actions efficiently
- `revokeSession()` - Terminate delegation session
- `extendSession(additionalDuration)` - Extend session duration

## How It Works

1. **Player Setup**: Player connects wallet and authorizes EIP-7702 delegation
2. **Code Delegation**: Player's EOA temporarily gets GhostSessionDelegate code
3. **AI Agent Actions**: AI Agent calls `executeGameAction` on the player's EOA
4. **Game Execution**: The EOA (now with delegate code) calls GameRegistry functions
5. **State Updates**: GameRegistry updates player state and emits events

## Security Features

### GhostSessionDelegate Security
- **Agent Authorization**: Only the specified AI Agent can execute actions
- **Session Management**: Time-limited sessions with spending caps
- **Replay Protection**: Nonce-based protection against replay attacks
- **Emergency Controls**: Session revocation and emergency withdrawal
- **Spending Limits**: Configurable ETH spending limits per session

### GameRegistry Security
- **Input Validation**: All parameters validated with custom errors
- **State Consistency**: Proper state transitions and validation
- **Event Logging**: Comprehensive event emission for monitoring
- **Gas Optimization**: Efficient storage patterns and batch operations

## Configuration

### Before Deployment
1. **Update Agent Address**: Replace the placeholder in `GhostSessionDelegate.sol`:
   ```solidity
   address public constant AGENT_ADDRESS = 0x1234567890123456789012345678901234567890;
   ```
   Replace with your actual AI Agent's wallet address.

2. **Review Spending Limits**: Adjust default limits and validation rules as needed.

3. **Configure Game Rules**: Modify GameRegistry logic to match your game's requirements.

## Deployment

### Prerequisites
- Node.js and npm installed
- Hardhat development environment
- Mantle network RPC endpoint
- Deployer wallet with sufficient ETH for gas

### Deploy Contracts
```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Deploy to Mantle testnet
npx hardhat run contracts/deploy.js --network mantle-testnet

# Deploy to Mantle mainnet
npx hardhat run contracts/deploy.js --network mantle-mainnet
```

### Verify Contracts
```bash
# Verify GameRegistry
npx hardhat verify --network mantle-testnet <GAME_REGISTRY_ADDRESS>

# Verify GhostSessionDelegate
npx hardhat verify --network mantle-testnet <GHOST_SESSION_DELEGATE_ADDRESS>
```

## Integration Examples

### Flutter SDK Integration
```dart
// Initialize session on player's EOA
await ghostPaySDK.initializeDelegationSession(
  maxSpendLimit: BigInt.from(1000000000000000000), // 1 ETH in wei
  duration: Duration(hours: 24),
);

// AI Agent executes game action
await ghostPaySDK.executeGameAction(
  targetContract: gameRegistryAddress,
  functionName: 'claimReward',
  parameters: [itemId, goldReward],
);
```

### AI Agent Backend Integration
```python
# Construct transaction for game action
transaction_data = game_registry.encodeABI(
    fn_name='claimReward',
    args=[item_id, gold_reward]
)

# Execute via player's delegated EOA
tx_hash = await execute_delegated_transaction(
    player_eoa_address=player_address,
    target_contract=game_registry_address,
    call_data=transaction_data
)
```

## Gas Optimization

### Batch Operations
Use batch functions when possible to reduce gas costs:
- `batchClaimRewards()` instead of multiple `claimReward()` calls
- `batchExecuteGameActions()` for multiple game actions

### Event Optimization
Events are optimized for indexing:
- Indexed parameters for efficient filtering
- Structured data for easy parsing
- Minimal gas overhead

## Testing

### Unit Tests
```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/GameRegistry.test.js
npx hardhat test test/GhostSessionDelegate.test.js
```

### Property-Based Tests
The contracts include property-based tests to verify correctness properties:
- Session management invariants
- Spending limit enforcement
- State transition validity
- Authorization security

## Monitoring and Analytics

### Event Monitoring
Monitor these events for system health:
- `GameActionExecuted` - Track AI Agent actions
- `ItemMinted` - Monitor reward distribution
- `DelegationSessionCreated/Revoked` - Track session lifecycle
- `SpendingLimitExceeded` - Monitor security violations

### Metrics to Track
- Session duration and usage patterns
- Gas consumption per action type
- Success/failure rates for delegated transactions
- Player engagement and reward distribution

## Troubleshooting

### Common Issues

1. **UnauthorizedAgent Error**
   - Verify AI Agent address is correctly configured
   - Check that the calling address matches AGENT_ADDRESS

2. **SessionExpired Error**
   - Session has exceeded its duration limit
   - Initialize a new session or extend the current one

3. **SpendingLimitExceeded Error**
   - Transaction would exceed the session's spending limit
   - Increase spending limit or start a new session

4. **ExecutionFailed Error**
   - The target contract call failed
   - Check GameRegistry function parameters and state

### Debug Tools
- Use `getSessionInfo()` to check delegation session status
- Monitor events for detailed execution information
- Use Hardhat's debugging tools for transaction analysis

## Security Considerations

### Production Checklist
- [ ] Update AGENT_ADDRESS to actual AI Agent wallet
- [ ] Review and test all spending limits
- [ ] Audit contract code for security vulnerabilities
- [ ] Test emergency functions (session revocation, withdrawal)
- [ ] Implement monitoring for suspicious activity
- [ ] Set up alerting for security events

### Best Practices
- Use time-limited sessions (max 24-48 hours)
- Set conservative spending limits initially
- Monitor session usage patterns
- Implement circuit breakers for unusual activity
- Regular security audits and updates

## License

MIT License - see LICENSE file for details.