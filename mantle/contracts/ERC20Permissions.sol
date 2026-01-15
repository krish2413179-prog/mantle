// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ERC20Permissions - TRUE ERC-7715 with ERC-20 tokens
 * @dev Uses ERC-20 approval pattern - money stays in wallet!
 * 
 * HOW IT WORKS:
 * 1. Player wraps MNT → WMANTLE (ERC-20 token)
 * 2. Player approves this contract to spend WMANTLE (NO MONEY SENT!)
 * 3. Player grants permission with spending cap
 * 4. When weapon vote passes, backend calls executeTeamAction
 * 5. Contract pulls WMANTLE from player's wallet (using approval)
 * 6. Backend receives WMANTLE as payment
 * 
 * BENEFITS:
 * - ✅ Money stays in player's wallet until weapon is used
 * - ✅ One-time approval, no signature per weapon
 * - ✅ Spending cap enforced
 * - ✅ Can revoke anytime
 * - ✅ No refund needed - unspent stays in wallet!
 */
contract ERC20Permissions {
    IERC20 public immutable token; // WMANTLE token
    
    struct Permission {
        uint256 maxAmount;   // Maximum that can be spent
        uint256 spent;       // Amount already spent
        uint256 expiry;      // When permission expires
        bool active;         // Is permission active
    }
    
    // owner => delegate => Permission
    mapping(address => mapping(address => Permission)) public permissions;
    
    // Events
    event PermissionGranted(address indexed owner, address indexed delegate, uint256 maxAmount, uint256 expiry);
    event PermissionIncreased(address indexed owner, address indexed delegate, uint256 newMaxAmount);
    event PermissionRevoked(address indexed owner, address indexed delegate);
    event FundsSpent(address indexed owner, address indexed delegate, uint256 amount);
    event TeamActionExecuted(address indexed leader, uint256 totalAmount, uint256 memberCount);
    
    constructor(address _token) {
        require(_token != address(0), "Invalid token");
        token = IERC20(_token);
    }
    
    /**
     * @dev Grant spending permission (NO MONEY SENT!)
     * Player must first approve this contract to spend their WMANTLE
     * 
     * Steps for player:
     * 1. Wrap MNT to WMANTLE: WMANTLE.deposit{value: 0.1 ether}()
     * 2. Approve contract: WMANTLE.approve(thisContract, 0.1 ether)
     * 3. Grant permission: grantPermission(backend, 0.1 ether, 86400)
     */
    function grantPermission(
        address delegate,
        uint256 maxAmount,
        uint256 duration
    ) external {
        require(delegate != address(0), "Invalid delegate");
        require(maxAmount > 0, "Max amount must be > 0");
        require(duration > 0, "Invalid duration");
        
        // Verify player has approved this contract
        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= maxAmount, "Insufficient token allowance");
        
        // Verify player has enough balance
        uint256 balance = token.balanceOf(msg.sender);
        require(balance >= maxAmount, "Insufficient token balance");
        
        Permission storage p = permissions[msg.sender][delegate];
        
        if (p.active) {
            // If already active, increase cap
            p.maxAmount += maxAmount;
            p.expiry = block.timestamp + duration;
            emit PermissionIncreased(msg.sender, delegate, p.maxAmount);
        } else {
            // New permission
            p.maxAmount = maxAmount;
            p.spent = 0;
            p.expiry = block.timestamp + duration;
            p.active = true;
            emit PermissionGranted(msg.sender, delegate, maxAmount, block.timestamp + duration);
        }
    }
    
    /**
     * @dev Increase permission cap
     * Player must approve additional amount first
     */
    function increasePermission(address delegate, uint256 additionalAmount) external {
        require(additionalAmount > 0, "Amount must be > 0");
        
        Permission storage p = permissions[msg.sender][delegate];
        require(p.active, "No active permission");
        
        // Verify allowance
        uint256 allowance = token.allowance(msg.sender, address(this));
        uint256 currentAvailable = p.maxAmount - p.spent;
        require(allowance >= currentAvailable + additionalAmount, "Insufficient allowance");
        
        p.maxAmount += additionalAmount;
        
        emit PermissionIncreased(msg.sender, delegate, p.maxAmount);
    }
    
    /**
     * @dev Revoke permission (NO REFUND NEEDED!)
     * Unspent amount stays in player's wallet
     */
    function revokePermission(address delegate) external {
        Permission storage p = permissions[msg.sender][delegate];
        require(p.active, "No active permission");
        
        p.active = false;
        
        emit PermissionRevoked(msg.sender, delegate);
    }
    
    /**
     * @dev Execute team action - PULLS tokens from players' wallets
     * Backend calls this after weapon vote passes
     * 
     * This will:
     * 1. Verify each player has permission
     * 2. Pull WMANTLE from each player's wallet (using their approval)
     * 3. Transfer total to backend as payment
     */
    function executeTeamAction(
        address[] calldata owners,
        uint256[] calldata amounts
    ) external {
        require(owners.length == amounts.length, "Length mismatch");
        require(owners.length > 0, "No owners");
        
        uint256 totalAmount = 0;
        
        // Pull tokens from each player
        for (uint256 i = 0; i < owners.length; i++) {
            address owner = owners[i];
            uint256 amount = amounts[i];
            
            Permission storage p = permissions[owner][msg.sender];
            
            require(p.active, "Permission not active");
            require(block.timestamp < p.expiry, "Permission expired");
            require(p.spent + amount <= p.maxAmount, "Exceeds permission limit");
            
            // PULL tokens from player's wallet
            bool success = token.transferFrom(owner, msg.sender, amount);
            require(success, "Token transfer failed");
            
            // Mark as spent
            p.spent += amount;
            totalAmount += amount;
            
            emit FundsSpent(owner, msg.sender, amount);
        }
        
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
     * @dev Get available spending amount
     */
    function getAvailableAmount(address owner, address delegate) external view returns (uint256) {
        Permission memory p = permissions[owner][delegate];
        
        if (!p.active || block.timestamp >= p.expiry) {
            return 0;
        }
        
        return p.maxAmount - p.spent;
    }
    
    /**
     * @dev Get total pool for team
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
