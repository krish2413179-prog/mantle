// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AdvancedPermissions - ERC-7715 Inspired
 * @dev Permission-based spending WITHOUT upfront transfer
 * 
 * HOW IT WORKS (Hybrid On-chain + Off-chain):
 * 1. User calls grantPermission() - Records permission on-chain (NO PAYMENT!)
 * 2. When weapon is used, backend collects signatures from users
 * 3. Backend calls executeWithSignatures() - Pulls funds from users
 * 4. Users can revoke anytime
 * 
 * This keeps funds in user wallets until actually spent!
 */
contract AdvancedPermissions {
    struct Permission {
        uint256 maxAmount;   // Maximum spendable amount
        uint256 spent;       // Amount already spent
        uint256 expiry;      // Expiry timestamp
        bool active;         // Active status
    }
    
    // owner => delegate => Permission
    mapping(address => mapping(address => Permission)) public permissions;
    
    // Nonces for replay protection
    mapping(address => uint256) public nonces;
    
    // EIP-712 Domain
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public constant SPEND_TYPEHASH = keccak256(
        "SpendPermission(address owner,address delegate,uint256 amount,uint256 nonce)"
    );
    
    event PermissionGranted(address indexed owner, address indexed delegate, uint256 maxAmount, uint256 expiry);
    event PermissionRevoked(address indexed owner, address indexed delegate);
    event FundsSpent(address indexed owner, address indexed delegate, uint256 amount);
    event TeamActionExecuted(address indexed leader, uint256 totalAmount);
    
    constructor() {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("AdvancedPermissions")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }
    
    /**
     * @dev Grant permission (NO PAYMENT - just records permission!)
     */
    function grantPermission(address delegate, uint256 maxAmount, uint256 duration) external {
        require(delegate != address(0), "Invalid delegate");
        require(maxAmount > 0, "Invalid amount");
        
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
        permissions[msg.sender][delegate].active = false;
        emit PermissionRevoked(msg.sender, delegate);
    }
    
    /**
     * @dev Execute team action with signatures (PULLS funds from wallets!)
     * Each owner must have signed approval for this specific spend
     */
    function executeWithSignatures(
        address payable[] calldata owners,
        uint256[] calldata amounts,
        uint8[] calldata v,
        bytes32[] calldata r,
        bytes32[] calldata s
    ) external payable {
        require(owners.length == amounts.length, "Length mismatch");
        require(owners.length == v.length, "Signature length mismatch");
        
        uint256 totalCollected = 0;
        
        for (uint256 i = 0; i < owners.length; i++) {
            address owner = owners[i];
            uint256 amount = amounts[i];
            
            // Verify permission
            Permission storage p = permissions[owner][msg.sender];
            require(p.active, "Permission not active");
            require(block.timestamp < p.expiry, "Permission expired");
            require(p.spent + amount <= p.maxAmount, "Exceeds max amount");
            
            // Verify signature
            bytes32 structHash = keccak256(
                abi.encode(SPEND_TYPEHASH, owner, msg.sender, amount, nonces[owner]++)
            );
            bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
            address signer = ecrecover(digest, v[i], r[i], s[i]);
            require(signer == owner, "Invalid signature");
            
            // Record spend
            p.spent += amount;
            totalCollected += amount;
            
            emit FundsSpent(owner, msg.sender, amount);
        }
        
        // Require exact payment
        require(msg.value == totalCollected, "Incorrect payment");
        
        emit TeamActionExecuted(msg.sender, totalCollected);
    }
    
    /**
     * @dev Simple execute - owners send funds with transaction
     * More practical for demo purposes
     */
    function executeTeamAction(
        address[] calldata owners,
        uint256[] calldata amounts
    ) external payable {
        require(owners.length == amounts.length, "Length mismatch");
        
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < owners.length; i++) {
            Permission storage p = permissions[owners[i]][msg.sender];
            
            require(p.active, "Permission not active");
            require(block.timestamp < p.expiry, "Permission expired");
            require(p.spent + amounts[i] <= p.maxAmount, "Exceeds max amount");
            
            p.spent += amounts[i];
            totalAmount += amounts[i];
            
            emit FundsSpent(owners[i], msg.sender, amounts[i]);
        }
        
        require(msg.value == totalAmount, "Incorrect payment");
        
        // Transfer to leader
        payable(msg.sender).transfer(msg.value);
        
        emit TeamActionExecuted(msg.sender, totalAmount);
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
     * @dev Get available amount
     */
    function getAvailableAmount(address owner, address delegate) external view returns (uint256) {
        Permission memory p = permissions[owner][delegate];
        
        if (!p.active || block.timestamp >= p.expiry) {
            return 0;
        }
        
        return p.maxAmount - p.spent;
    }
}
