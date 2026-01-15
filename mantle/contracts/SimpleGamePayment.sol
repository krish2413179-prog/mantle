// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SimpleGamePayment - WMANTLE as Game Currency
 * @dev Real-time deduction from player wallets, no delegation needed
 * 
 * HOW IT WORKS:
 * 1. Player wraps MNT → WMANTLE (one-time, shows as balance)
 * 2. Player approves contract to spend WMANTLE (one-time, unlimited)
 * 3. Play game - WMANTLE deducted automatically when weapon used
 * 
 * NO DELEGATION, NO PERMISSION CAPS - Just approve once and play!
 */
contract SimpleGamePayment {
    IERC20 public immutable wmantle;
    
    event WeaponPurchased(address indexed leader, address[] players, uint256 totalCost);
    event PaymentCollected(address indexed player, uint256 amount);
    
    constructor(address _wmantle) {
        require(_wmantle != address(0), "Invalid token");
        wmantle = IERC20(_wmantle);
    }
    
    /**
     * @dev Purchase weapon - pulls WMANTLE from all players
     * Backend calls this when weapon vote passes
     * 
     * @param players Array of player addresses
     * @param costPerPlayer Amount to deduct from each player
     */
    function purchaseWeapon(
        address[] calldata players,
        uint256 costPerPlayer
    ) external {
        require(players.length > 0, "No players");
        require(costPerPlayer > 0, "Invalid cost");
        
        uint256 totalCost = 0;
        
        // Pull WMANTLE from each player
        for (uint256 i = 0; i < players.length; i++) {
            address player = players[i];
            
            // Check balance
            require(wmantle.balanceOf(player) >= costPerPlayer, "Insufficient balance");
            
            // Pull WMANTLE from player to backend
            bool success = wmantle.transferFrom(player, msg.sender, costPerPlayer);
            require(success, "Transfer failed");
            
            totalCost += costPerPlayer;
            
            emit PaymentCollected(player, costPerPlayer);
        }
        
        emit WeaponPurchased(msg.sender, players, totalCost);
    }
    
    /**
     * @dev Check if player has approved contract
     */
    function isApproved(address player) external view returns (bool) {
        uint256 allowance = wmantle.allowance(player, address(this));
        // Check for unlimited approval (type(uint256).max)
        return allowance >= 1000 ether; // Or any reasonable max
    }
    
    /**
     * @dev Get player's WMANTLE balance
     */
    function getBalance(address player) external view returns (uint256) {
        return wmantle.balanceOf(player);
    }
}
