// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title GhostSessionDelegate
 * @dev The "brain" that the player's EOA temporarily becomes via EIP-7702.
 * This contract contains the logic to verify the AI Agent's commands and execute them.
 * The Player's EOA will "paste" this code onto itself temporarily through EIP-7702 delegation.
 */
contract GhostSessionDelegate {
    // Configuration - replace with your actual AI Agent's backend wallet address
    address public constant AGENT_ADDRESS = 0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081; // AI Agent wallet address
    
    // Session management
    struct DelegationSession {
        uint256 maxSpendLimit;      // Maximum ETH the agent can spend
        uint256 currentSpent;       // Amount already spent in this session
        uint256 expiresAt;          // Timestamp when delegation expires
        bool isActive;              // Whether the session is currently active
        uint256 nonce;              // Nonce for replay protection
    }
    
    // Storage for delegation session (stored on the EOA when code is delegated)
    DelegationSession public session;
    
    // Events for monitoring and auditing
    event GameActionExecuted(address indexed targetContract, bytes4 indexed methodSelector, bool success);
    event DelegationSessionCreated(uint256 maxSpendLimit, uint256 expiresAt);
    event DelegationSessionRevoked();
    event SpendingLimitExceeded(uint256 attempted, uint256 remaining);
    
    // Custom error types for gas efficiency
    error UnauthorizedAgent();
    error ExecutionFailed();
    error SessionExpired();
    error SessionInactive();
    error SpendingLimitExceededError();
    error InvalidSpendLimit();
    error InvalidDuration();

    /**
     * @dev Initialize a new delegation session
     * @param maxSpendLimit Maximum ETH the agent can spend (in wei)
     * @param duration Duration of the session in seconds
     */
    function initializeSession(uint256 maxSpendLimit, uint256 duration) external {
        // Only the EOA owner can initialize their own session
        if (msg.sender != address(this)) revert UnauthorizedAgent();
        if (maxSpendLimit == 0) revert InvalidSpendLimit();
        if (duration == 0 || duration > 30 days) revert InvalidDuration();
        
        session = DelegationSession({
            maxSpendLimit: maxSpendLimit,
            currentSpent: 0,
            expiresAt: block.timestamp + duration,
            isActive: true,
            nonce: 0
        });
        
        emit DelegationSessionCreated(maxSpendLimit, block.timestamp + duration);
    }

    /**
     * @dev The main function that the AI Agent calls on the Player's EOA
     * This function executes game actions on behalf of the player
     * @param targetContract The game contract to call (e.g., GameRegistry)
     * @param data The encoded function call data
     */
    function executeGameAction(address targetContract, bytes calldata data) external payable {
        // Security Check 1: Only the authorized AI Agent can trigger this EOA's actions
        if (msg.sender != AGENT_ADDRESS) {
            revert UnauthorizedAgent();
        }
        
        // Security Check 2: Verify session is active and not expired
        if (!session.isActive) {
            revert SessionInactive();
        }
        
        if (block.timestamp > session.expiresAt) {
            revert SessionExpired();
        }
        
        // Security Check 3: Verify spending limits
        if (msg.value > 0) {
            if (session.currentSpent + msg.value > session.maxSpendLimit) {
                emit SpendingLimitExceeded(msg.value, session.maxSpendLimit - session.currentSpent);
                revert SpendingLimitExceededError();
            }
            session.currentSpent += msg.value;
        }
        
        // Increment nonce for replay protection
        session.nonce++;
        
        // Execute the call - The EOA calls the GameRegistry
        // This is where the magic happens: the EOA (with this delegate code) calls the game contract
        (bool success, ) = targetContract.call{value: msg.value}(data);
        
        if (!success) {
            revert ExecutionFailed();
        }
        
        // Extract method selector for event logging
        bytes4 methodSelector = bytes4(data[:4]);
        emit GameActionExecuted(targetContract, methodSelector, success);
    }

    /**
     * @dev Execute multiple game actions in a single transaction (batch operation)
     * @param targetContracts Array of contracts to call
     * @param callsData Array of encoded function call data
     * @param values Array of ETH values to send with each call
     */
    function batchExecuteGameActions(
        address[] calldata targetContracts,
        bytes[] calldata callsData,
        uint256[] calldata values
    ) external payable {
        if (msg.sender != AGENT_ADDRESS) {
            revert UnauthorizedAgent();
        }
        
        if (!session.isActive || block.timestamp > session.expiresAt) {
            revert SessionExpired();
        }
        
        if (targetContracts.length != callsData.length || callsData.length != values.length) {
            revert ExecutionFailed();
        }
        
        // Calculate total value and check spending limit
        uint256 totalValue = 0;
        for (uint256 i = 0; i < values.length; i++) {
            totalValue += values[i];
        }
        
        if (totalValue > 0) {
            if (session.currentSpent + totalValue > session.maxSpendLimit) {
                revert SpendingLimitExceededError();
            }
            session.currentSpent += totalValue;
        }
        
        session.nonce++;
        
        // Execute all calls
        for (uint256 i = 0; i < targetContracts.length; i++) {
            (bool success, ) = targetContracts[i].call{value: values[i]}(callsData[i]);
            
            if (!success) {
                revert ExecutionFailed();
            }
            
            bytes4 methodSelector = bytes4(callsData[i][:4]);
            emit GameActionExecuted(targetContracts[i], methodSelector, success);
        }
    }

    /**
     * @dev Revoke the current delegation session
     * Can be called by either the EOA owner or the agent (for emergency stops)
     */
    function revokeSession() external {
        if (msg.sender != address(this) && msg.sender != AGENT_ADDRESS) {
            revert UnauthorizedAgent();
        }
        
        session.isActive = false;
        emit DelegationSessionRevoked();
    }

    /**
     * @dev Emergency function to withdraw any ETH accidentally sent to this contract
     * Only the EOA owner can call this
     */
    function emergencyWithdraw() external {
        if (msg.sender != address(this)) {
            revert UnauthorizedAgent();
        }
        
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = payable(address(this)).call{value: balance}("");
            if (!success) {
                revert ExecutionFailed();
            }
        }
    }

    /**
     * @dev Extend the current session duration
     * @param additionalDuration Additional time to add to the session (in seconds)
     */
    function extendSession(uint256 additionalDuration) external {
        if (msg.sender != address(this)) {
            revert UnauthorizedAgent();
        }
        
        if (!session.isActive) {
            revert SessionInactive();
        }
        
        if (additionalDuration == 0 || additionalDuration > 30 days) {
            revert InvalidDuration();
        }
        
        session.expiresAt += additionalDuration;
    }

    /**
     * @dev Increase the spending limit for the current session
     * @param additionalLimit Additional ETH spending limit (in wei)
     */
    function increaseSpendingLimit(uint256 additionalLimit) external {
        if (msg.sender != address(this)) {
            revert UnauthorizedAgent();
        }
        
        if (!session.isActive) {
            revert SessionInactive();
        }
        
        if (additionalLimit == 0) {
            revert InvalidSpendLimit();
        }
        
        session.maxSpendLimit += additionalLimit;
    }

    // View functions for monitoring session state
    
    /**
     * @dev Get current session information
     */
    function getSessionInfo() external view returns (
        uint256 maxSpendLimit,
        uint256 currentSpent,
        uint256 expiresAt,
        bool isActive,
        uint256 nonce,
        uint256 remainingLimit,
        uint256 timeRemaining
    ) {
        return (
            session.maxSpendLimit,
            session.currentSpent,
            session.expiresAt,
            session.isActive,
            session.nonce,
            session.maxSpendLimit - session.currentSpent,
            session.expiresAt > block.timestamp ? session.expiresAt - block.timestamp : 0
        );
    }

    /**
     * @dev Check if the session is currently valid and active
     */
    function isSessionValid() external view returns (bool) {
        return session.isActive && block.timestamp <= session.expiresAt;
    }

    /**
     * @dev Get the authorized agent address
     */
    function getAuthorizedAgent() external pure returns (address) {
        return AGENT_ADDRESS;
    }

    // Fallback function to handle direct ETH transfers
    receive() external payable {
        // Allow receiving ETH for game transactions
    }
}