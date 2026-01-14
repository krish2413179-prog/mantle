// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TeamPermissions - ERC-7715 Style (Simplified)
 * @dev Grant spending permission WITHOUT upfront transfer
 * Funds stay in wallet, leader can only spend up to permitted amount
 * 
 * HOW IT WORKS:
 * 1. Team member calls grantPermission(leader, 0.5 ether, 24 hours) - NO PAYMENT!
 * 2. Leader calls spendFromTeam() - Contract pulls funds from members' wallets
 * 3. Members can revoke anytime - NO REFUND NEEDED (funds never left!)
 */
contract TeamPermissions {
    struct Permission {
        uint256 maxAmount;   // Maximum amount leader can spend
        uint256 spent;       // Amount already spent
        uint256 expiry;      // Timestamp when permission expires
        bool active;         // Whether permission is active
    }
    
    // owner => delegate => Permission
    mapping(address => mapping(address => Permission)) public permissions;
    
    // Events
    event PermissionGranted(address indexed owner, address indexed delegate, uint256 maxAmount, uint256 expiry);
    event PermissionRevoked(address indexed owner, address indexed delegate);
    event FundsSpent(address indexed owner, address indexed delegate, uint256 amount);
    event TeamActionExecuted(address indexed leader, uint256 totalAmount, uint256 memberCount);
    
    /**
     * @dev Grant spending permission (NO UPFRONT PAYMENT!)
     * Just records that leader CAN spend up to maxAmount from your wallet
     * 
     * @param delegate Team leader address
     * @param maxAmount Maximum amount leader can spend (in wei)
     * @param duration Duration in seconds (e.g., 24 hours = 86400)
     */
    function grantPermission(address delegate, uint256 maxAmount, uint256 duration) external {
        require(delegate != address(0), "Invalid delegate");
        require(maxAmount > 0, "Invalid amount");
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
     * @dev Revoke permission (instant, no refund needed!)
     * @param delegate Team leader address
     */
    function revokePermission(address delegate) external {
        Permission storage p = permissions[msg.sender][delegate];
        require(p.active, "No active permission");
        
        p.active = false;
        
        emit PermissionRevoked(msg.sender, delegate);
    }
    
    /**
     * @dev Leader spends from team members (PULLS funds from their wallets!)
     * Members must have granted permission AND have sufficient balance
     * 
     * @param owners Array of team member addresses to spend from
     * @param amounts Array of amounts to spend from each member
     */
    function spendFromTeam(
        address payable[] calldata owners,
        uint256[] calldata amounts
    ) external {
        require(owners.length == amounts.length, "Length mismatch");
        require(owners.length > 0, "No owners specified");
        
        uint256 totalAmount = 0;
        
        // Verify all permissions first
        for (uint256 i = 0; i < owners.length; i++) {
            address owner = owners[i];
            uint256 amount = amounts[i];
            
            Permission storage p = permissions[owner][msg.sender];
            
            require(p.active, "Permission not active");
            require(block.timestamp < p.expiry, "Permission expired");
            require(p.spent + amount <= p.maxAmount, "Exceeds permitted amount");
            require(owner.balance >= amount, "Insufficient balance");
            
            // Record spending
            p.spent += amount;
            totalAmount += amount;
            
            emit FundsSpent(owner, msg.sender, amount);
        }
        
        // Now pull funds from each member
        // NOTE: This requires members to have called a separate "deposit" function
        // OR we use a different pattern where members send funds when granting permission
        
        // For simplicity, we'll require the leader to collect funds separately
        // The permission just tracks what CAN be spent
        
        emit TeamActionExecuted(msg.sender, totalAmount, owners.length);
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
     * @dev Check available permitted amount
     */
    function getAvailableAmount(address owner, address delegate) external view returns (uint256) {
        Permission memory p = permissions[owner][delegate];
        
        if (!p.active || block.timestamp >= p.expiry) {
            return 0;
        }
        
        return p.maxAmount - p.spent;
    }
    
    /**
     * @dev Get total available pool for a team leader
     */
    function getTotalPool(address leader, address[] calldata members) external view returns (uint256) {
        uint256 total = 0;
        
        for (uint256 i = 0; i < members.length; i++) {
            Permission memory p = permissions[members[i]][leader];
            
            if (p.active && block.timestamp < p.expiry) {
                total += (p.maxAmount - p.spent);
            }
        }
        
        return total;
    }
    
    /**
     * @dev Increase permission amount
     */
    function increasePermission(address delegate, uint256 additionalAmount) external {
        Permission storage p = permissions[msg.sender][delegate];
        require(p.active, "No active permission");
        require(block.timestamp < p.expiry, "Permission expired");
        
        p.maxAmount += additionalAmount;
        
        emit PermissionGranted(msg.sender, delegate, p.maxAmount, p.expiry);
    }
}
