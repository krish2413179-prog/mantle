// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TrueERC7715Permissions
 * @dev TRUE ERC-7715 Implementation
 * 
 * HOW IT WORKS:
 * 1. Player grants permission (sets spending cap) - NO PAYMENT
 * 2. Funds stay in player's wallet
 * 3. When weapon is used:
 *    - Backend creates transaction
 *    - Each player MUST approve and send their share
 *    - Backend collects all shares and executes
 * 4. Backend pays gas, gets weapon cost as payment
 * 
 * This requires MULTI-SIG style execution where each player
 * must approve their contribution for each weapon launch
 */
contract TrueERC7715Permissions {
    struct Permission {
        uint256 maxAmount;   // Maximum total that can be spent
        uint256 spent;       // Amount already spent
        uint256 expiry;      // When permission expires
        bool active;         // Is permission active
    }
    
    struct PendingAction {
        address[] owners;           // Players contributing
        uint256[] amounts;          // Amount from each player
        mapping(address => bool) approved;  // Who has approved
        uint256 approvalCount;      // How many approved
        uint256 totalAmount;        // Total needed
        bool executed;              // Has been executed
        uint256 createdAt;          // When created
    }
    
    // owner => delegate => Permission
    mapping(address => mapping(address => Permission)) public permissions;
    
    // actionId => PendingAction
    mapping(bytes32 => PendingAction) public pendingActions;
    
    // Events
    event PermissionGranted(address indexed owner, address indexed delegate, uint256 maxAmount, uint256 expiry);
    event PermissionRevoked(address indexed owner, address indexed delegate);
    event ActionProposed(bytes32 indexed actionId, address indexed proposer, uint256 totalAmount);
    event ActionApproved(bytes32 indexed actionId, address indexed approver, uint256 amount);
    event ActionExecuted(bytes32 indexed actionId, uint256 totalAmount);
    event FundsSpent(address indexed owner, address indexed delegate, uint256 amount);
    
    /**
     * @dev Grant spending permission (NO PAYMENT!)
     */
    function grantPermission(
        address delegate,
        uint256 maxAmount,
        uint256 duration
    ) external {
        require(delegate != address(0), "Invalid delegate");
        require(maxAmount > 0, "Max amount must be > 0");
        require(duration > 0, "Invalid duration");
        
        permissions[msg.sender][delegate] = Permission({
            maxAmount: maxAmount,
            spent: 0,
            expiry: block.timestamp + duration,
            active: true
        });
        
        emit PermissionGranted(msg.sender, delegate, maxAmount, block.timestamp + duration);
    }
    
    /**
     * @dev Revoke permission
     */
    function revokePermission(address delegate) external {
        Permission storage p = permissions[msg.sender][delegate];
        require(p.active, "No active permission");
        
        p.active = false;
        
        emit PermissionRevoked(msg.sender, delegate);
    }
    
    /**
     * @dev Propose a team action (weapon launch)
     * Backend calls this to initiate weapon purchase
     */
    function proposeTeamAction(
        address[] calldata owners,
        uint256[] calldata amounts
    ) external returns (bytes32 actionId) {
        require(owners.length == amounts.length, "Length mismatch");
        require(owners.length > 0, "No owners");
        
        // Generate unique action ID
        actionId = keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            owners,
            amounts
        ));
        
        PendingAction storage action = pendingActions[actionId];
        require(action.createdAt == 0, "Action already exists");
        
        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        
        action.owners = owners;
        action.amounts = amounts;
        action.totalAmount = total;
        action.createdAt = block.timestamp;
        action.executed = false;
        action.approvalCount = 0;
        
        emit ActionProposed(actionId, msg.sender, total);
        
        return actionId;
    }
    
    /**
     * @dev Player approves and sends their share for a weapon
     * Each player must call this and send their MNT
     */
    function approveAndPay(bytes32 actionId, address delegate) external payable {
        PendingAction storage action = pendingActions[actionId];
        require(action.createdAt > 0, "Action not found");
        require(!action.executed, "Already executed");
        require(!action.approved[msg.sender], "Already approved");
        require(block.timestamp < action.createdAt + 5 minutes, "Action expired");
        
        // Find this player's amount
        uint256 playerAmount = 0;
        bool found = false;
        for (uint256 i = 0; i < action.owners.length; i++) {
            if (action.owners[i] == msg.sender) {
                playerAmount = action.amounts[i];
                found = true;
                break;
            }
        }
        
        require(found, "Not part of this action");
        require(msg.value == playerAmount, "Must send exact amount");
        
        // Check permission
        Permission storage p = permissions[msg.sender][delegate];
        require(p.active, "Permission not active");
        require(block.timestamp < p.expiry, "Permission expired");
        require(p.spent + playerAmount <= p.maxAmount, "Exceeds permission");
        
        // Mark as approved and spent
        action.approved[msg.sender] = true;
        action.approvalCount++;
        p.spent += playerAmount;
        
        emit ActionApproved(actionId, msg.sender, playerAmount);
        emit FundsSpent(msg.sender, delegate, playerAmount);
        
        // If all approved, execute automatically
        if (action.approvalCount == action.owners.length) {
            _executeAction(actionId, delegate);
        }
    }
    
    /**
     * @dev Execute action after all approvals (internal)
     */
    function _executeAction(bytes32 actionId, address delegate) internal {
        PendingAction storage action = pendingActions[actionId];
        require(!action.executed, "Already executed");
        require(action.approvalCount == action.owners.length, "Not all approved");
        
        action.executed = true;
        
        // Transfer all collected funds to delegate (backend)
        payable(delegate).transfer(action.totalAmount);
        
        emit ActionExecuted(actionId, action.totalAmount);
    }
    
    /**
     * @dev Get permission details
     */
    function getPermission(address owner, address delegate) external view returns (
        uint256 maxAmount,
        uint256 spent,
        uint256 expiry,
        bool active,
        uint256 available
    ) {
        Permission memory p = permissions[owner][delegate];
        bool isActive = p.active && block.timestamp < p.expiry;
        uint256 availableAmount = isActive ? (p.maxAmount - p.spent) : 0;
        
        return (p.maxAmount, p.spent, p.expiry, isActive, availableAmount);
    }
    
    /**
     * @dev Check if action is fully approved
     */
    function isActionReady(bytes32 actionId) external view returns (bool) {
        PendingAction storage action = pendingActions[actionId];
        return action.approvalCount == action.owners.length && !action.executed;
    }
}
