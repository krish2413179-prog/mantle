// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TeamDelegation
 * @dev Allows team members to delegate spending permission to team leader
 * Leader can then spend from multiple wallets for coordinated team attacks
 */
contract TeamDelegation {
    struct Delegation {
        uint256 amount;      // Amount delegated in wei
        uint256 expiry;      // Timestamp when delegation expires
        uint256 spent;       // Amount already spent
        bool active;         // Whether delegation is active
    }
    
    // owner => delegate => Delegation
    mapping(address => mapping(address => Delegation)) public delegations;
    
    // Events
    event PermissionDelegated(address indexed owner, address indexed delegate, uint256 amount, uint256 expiry);
    event PermissionRevoked(address indexed owner, address indexed delegate);
    event DelegatedSpend(address indexed owner, address indexed delegate, uint256 amount);
    event TeamActionExecuted(address indexed leader, uint256 totalAmount, uint256 memberCount);
    
    /**
     * @dev Delegate spending permission to team leader
     * @param delegate Team leader address
     * @param duration Duration in seconds (e.g., 24 hours = 86400)
     */
    function delegateToLeader(address delegate, uint256 duration) external payable {
        require(delegate != address(0), "Invalid delegate");
        require(msg.value > 0, "Must send ETH to delegate");
        require(duration > 0, "Invalid duration");
        
        delegations[msg.sender][delegate] = Delegation({
            amount: msg.value,
            expiry: block.timestamp + duration,
            spent: 0,
            active: true
        });
        
        emit PermissionDelegated(msg.sender, delegate, msg.value, block.timestamp + duration);
    }
    
    /**
     * @dev Revoke delegation and get refund of unspent amount
     * @param delegate Team leader address
     */
    function revokePermission(address delegate) external {
        Delegation storage d = delegations[msg.sender][delegate];
        require(d.active, "No active delegation");
        
        uint256 refundAmount = d.amount - d.spent;
        d.active = false;
        
        if (refundAmount > 0) {
            payable(msg.sender).transfer(refundAmount);
        }
        
        emit PermissionRevoked(msg.sender, delegate);
    }
    
    /**
     * @dev Team leader spends from multiple delegated wallets
     * @param owners Array of team member addresses
     * @param amounts Array of amounts to spend from each member
     */
    function executeTeamAction(
        address[] calldata owners,
        uint256[] calldata amounts
    ) external {
        require(owners.length == amounts.length, "Length mismatch");
        require(owners.length > 0, "No owners specified");
        
        uint256 totalAmount = 0;
        
        // Verify and record spending from each member
        for (uint256 i = 0; i < owners.length; i++) {
            address owner = owners[i];
            uint256 amount = amounts[i];
            
            Delegation storage d = delegations[owner][msg.sender];
            
            require(d.active, "Delegation not active");
            require(block.timestamp < d.expiry, "Delegation expired");
            require(d.spent + amount <= d.amount, "Insufficient delegated amount");
            
            d.spent += amount;
            totalAmount += amount;
            
            emit DelegatedSpend(owner, msg.sender, amount);
        }
        
        // Transfer combined funds to team leader
        payable(msg.sender).transfer(totalAmount);
        
        emit TeamActionExecuted(msg.sender, totalAmount, owners.length);
    }
    
    /**
     * @dev Get delegation details
     */
    function getDelegation(address owner, address delegate) external view returns (
        uint256 amount,
        uint256 expiry,
        uint256 spent,
        bool active,
        uint256 available
    ) {
        Delegation memory d = delegations[owner][delegate];
        bool isActive = d.active && block.timestamp < d.expiry;
        uint256 availableAmount = isActive ? (d.amount - d.spent) : 0;
        
        return (d.amount, d.expiry, d.spent, isActive, availableAmount);
    }
    
    /**
     * @dev Check available delegated amount
     */
    function getAvailableAmount(address owner, address delegate) external view returns (uint256) {
        Delegation memory d = delegations[owner][delegate];
        
        if (!d.active || block.timestamp >= d.expiry) {
            return 0;
        }
        
        return d.amount - d.spent;
    }
    
    /**
     * @dev Get total available pool for a team leader
     */
    function getTotalPool(address leader, address[] calldata members) external view returns (uint256) {
        uint256 total = 0;
        
        for (uint256 i = 0; i < members.length; i++) {
            Delegation memory d = delegations[members[i]][leader];
            
            if (d.active && block.timestamp < d.expiry) {
                total += (d.amount - d.spent);
            }
        }
        
        return total;
    }
}
