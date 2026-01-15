// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PracticalERC7715 - Best of Both Worlds
 * @dev Practical ERC-7715 implementation for gaming
 * 
 * HOW IT WORKS:
 * 1. Player grants permission with spending cap (e.g., 0.1 MNT max)
 * 2. Player sends ONLY the cap amount ONCE to contract as collateral
 * 3. Backend can spend from this collateral up to the cap
 * 4. When permission is revoked, unspent amount is refunded
 * 5. Player can increase cap by sending more
 * 
 * BENEFITS:
 * - ✅ One-time approval (not per weapon)
 * - ✅ Spending cap enforced
 * - ✅ Gasless weapon launches for players
 * - ✅ Refund of unspent amount
 * - ✅ Can increase cap anytime
 * - ✅ Backend pays gas, gets weapon cost
 */
contract PracticalERC7715 {
    struct Permission {
        uint256 maxAmount;   // Maximum that can be spent (collateral deposited)
        uint256 spent;       // Amount already spent
        uint256 expiry;      // When permission expires
        bool active;         // Is permission active
    }
    
    // owner => delegate => Permission
    mapping(address => mapping(address => Permission)) public permissions;
    
    // Events
    event PermissionGranted(address indexed owner, address indexed delegate, uint256 maxAmount, uint256 expiry);
    event PermissionIncreased(address indexed owner, address indexed delegate, uint256 newMaxAmount);
    event PermissionRevoked(address indexed owner, address indexed delegate, uint256 refundAmount);
    event FundsSpent(address indexed owner, address indexed delegate, uint256 amount);
    event TeamActionExecuted(address indexed leader, uint256 totalAmount, uint256 memberCount);
    
    /**
     * @dev Grant permission by depositing collateral
     * Player sends MNT once, backend can spend from it
     */
    function grantPermission(
        address delegate,
        uint256 duration
    ) external payable {
        require(delegate != address(0), "Invalid delegate");
        require(msg.value > 0, "Must deposit collateral");
        require(duration > 0, "Invalid duration");
        
        Permission storage p = permissions[msg.sender][delegate];
        
        if (p.active) {
            // If already active, add to existing
            p.maxAmount += msg.value;
            p.expiry = block.timestamp + duration; // Reset expiry
            emit PermissionIncreased(msg.sender, delegate, p.maxAmount);
        } else {
            // New permission
            p.maxAmount = msg.value;
            p.spent = 0;
            p.expiry = block.timestamp + duration;
            p.active = true;
            emit PermissionGranted(msg.sender, delegate, msg.value, block.timestamp + duration);
        }
    }
    
    /**
     * @dev Increase permission by adding more collateral
     */
    function increasePermission(address delegate) external payable {
        require(msg.value > 0, "Must send MNT");
        
        Permission storage p = permissions[msg.sender][delegate];
        require(p.active, "No active permission");
        
        p.maxAmount += msg.value;
        
        emit PermissionIncreased(msg.sender, delegate, p.maxAmount);
    }
    
    /**
     * @dev Revoke permission and get refund of unspent collateral
     */
    function revokePermission(address delegate) external {
        Permission storage p = permissions[msg.sender][delegate];
        require(p.active, "No active permission");
        
        uint256 refundAmount = p.maxAmount - p.spent;
        p.active = false;
        
        if (refundAmount > 0) {
            payable(msg.sender).transfer(refundAmount);
        }
        
        emit PermissionRevoked(msg.sender, delegate, refundAmount);
    }
    
    /**
     * @dev Backend executes team action (weapon launch)
     * Spends from each player's collateral
     */
    function executeTeamAction(
        address[] calldata owners,
        uint256[] calldata amounts
    ) external {
        require(owners.length == amounts.length, "Length mismatch");
        require(owners.length > 0, "No owners");
        
        uint256 totalAmount = 0;
        
        // Verify permissions and mark as spent
        for (uint256 i = 0; i < owners.length; i++) {
            address owner = owners[i];
            uint256 amount = amounts[i];
            
            Permission storage p = permissions[owner][msg.sender];
            
            require(p.active, "Permission not active");
            require(block.timestamp < p.expiry, "Permission expired");
            require(p.spent + amount <= p.maxAmount, "Exceeds permission limit");
            
            // Debit from this player's collateral
            p.spent += amount;
            totalAmount += amount;
            
            emit FundsSpent(owner, msg.sender, amount);
        }
        
        // Transfer total to backend (payment for gas + service)
        payable(msg.sender).transfer(totalAmount);
        
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
     * @dev Get available amount for spending
     */
    function getAvailableAmount(address owner, address delegate) external view returns (uint256) {
        Permission memory p = permissions[owner][delegate];
        
        if (!p.active || block.timestamp >= p.expiry) {
            return 0;
        }
        
        return p.maxAmount - p.spent;
    }
    
    /**
     * @dev Get total pool available for team
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
}
