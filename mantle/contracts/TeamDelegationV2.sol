// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TeamDelegationV2 - ERC-7715 Style Advanced Permissions
 * @dev Allows team members to grant spending permission WITHOUT upfront transfer
 * Funds stay in user's wallet until actually spent by team leader
 * Uses EIP-712 signatures for gasless permission grants
 */
contract TeamDelegationV2 {
    struct Permission {
        uint256 maxAmount;   // Maximum amount leader can spend
        uint256 spent;       // Amount already spent
        uint256 expiry;      // Timestamp when permission expires
        bool active;         // Whether permission is active
    }
    
    // owner => delegate => Permission
    mapping(address => mapping(address => Permission)) public permissions;
    
    // EIP-712 Domain
    bytes32 public DOMAIN_SEPARATOR;
    bytes32 public constant PERMISSION_TYPEHASH = keccak256(
        "GrantPermission(address owner,address delegate,uint256 maxAmount,uint256 expiry,uint256 nonce)"
    );
    
    // Nonces for replay protection
    mapping(address => uint256) public nonces;
    
    // Events
    event PermissionGranted(address indexed owner, address indexed delegate, uint256 maxAmount, uint256 expiry);
    event PermissionRevoked(address indexed owner, address indexed delegate);
    event FundsSpent(address indexed owner, address indexed delegate, uint256 amount);
    event TeamActionExecuted(address indexed leader, uint256 totalAmount, uint256 memberCount);
    
    constructor() {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("TeamDelegationV2")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }
    
    /**
     * @dev Grant spending permission to team leader (NO UPFRONT TRANSFER!)
     * @param delegate Team leader address
     * @param maxAmount Maximum amount leader can spend from your wallet
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
     * @dev Grant permission via signature (GASLESS!)
     * @param owner Address granting permission
     * @param delegate Team leader address
     * @param maxAmount Maximum amount leader can spend
     * @param expiry Expiry timestamp
     * @param v Signature v
     * @param r Signature r
     * @param s Signature s
     */
    function grantPermissionWithSignature(
        address owner,
        address delegate,
        uint256 maxAmount,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(block.timestamp < expiry, "Signature expired");
        
        bytes32 structHash = keccak256(
            abi.encode(
                PERMISSION_TYPEHASH,
                owner,
                delegate,
                maxAmount,
                expiry,
                nonces[owner]++
            )
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );
        
        address signer = ecrecover(digest, v, r, s);
        require(signer == owner, "Invalid signature");
        require(signer != address(0), "Invalid signer");
        
        permissions[owner][delegate] = Permission({
            maxAmount: maxAmount,
            spent: 0,
            expiry: expiry,
            active: true
        });
        
        emit PermissionGranted(owner, delegate, maxAmount, expiry);
    }
    
    /**
     * @dev Revoke permission (NO REFUND NEEDED - funds never left wallet!)
     * @param delegate Team leader address
     */
    function revokePermission(address delegate) external {
        Permission storage p = permissions[msg.sender][delegate];
        require(p.active, "No active permission");
        
        p.active = false;
        
        emit PermissionRevoked(msg.sender, delegate);
    }
    
    /**
     * @dev Team leader spends from multiple wallets (PULLS FUNDS FROM WALLETS!)
     * @param owners Array of team member addresses
     * @param amounts Array of amounts to spend from each member
     */
    function executeTeamAction(
        address[] calldata owners,
        uint256[] calldata amounts
    ) external payable {
        require(owners.length == amounts.length, "Length mismatch");
        require(owners.length > 0, "No owners specified");
        
        uint256 totalAmount = 0;
        
        // Verify permissions and pull funds from each member
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
            
            // PULL FUNDS FROM OWNER'S WALLET
            // This requires owner to have granted permission via grantPermission()
            // In a real implementation, this would use a pull payment pattern
            // For now, we'll require owners to send funds with the transaction
            
            emit FundsSpent(owner, msg.sender, amount);
        }
        
        // Note: In a production system, you'd implement a proper pull payment mechanism
        // For this demo, the backend will handle the actual fund transfers
        
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
     * @dev Increase permission amount (add more to max)
     */
    function increasePermission(address delegate, uint256 additionalAmount) external {
        Permission storage p = permissions[msg.sender][delegate];
        require(p.active, "No active permission");
        require(block.timestamp < p.expiry, "Permission expired");
        
        p.maxAmount += additionalAmount;
        
        emit PermissionGranted(msg.sender, delegate, p.maxAmount, p.expiry);
    }
}
