// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title GameRegistry
 * @dev The actual game logic contract that manages player state and items.
 * This contract doesn't know about EIP-7702; it just sees msg.sender as the player.
 * The player's EOA (temporarily upgraded with GhostSessionDelegate code) calls this contract.
 */
contract GameRegistry {
    // Player state structure
    struct PlayerStats {
        uint256 gold;
        uint256 experience;
        uint256 level;
        mapping(uint256 => bool) inventory; // itemID => owned
        mapping(uint256 => uint256) itemQuantities; // itemID => quantity
    }

    // Storage
    mapping(address => PlayerStats) public players;
    
    // Events for indexing and monitoring
    event ItemMinted(address indexed player, uint256 itemId, uint256 quantity);
    event GoldEarned(address indexed player, uint256 amount);
    event ExperienceGained(address indexed player, uint256 amount);
    event LevelUp(address indexed player, uint256 newLevel);
    event PlayerStateUpdated(address indexed player, uint256 level, uint256 experience, uint256 gold);

    // Custom errors for gas efficiency
    error InvalidItemId();
    error InvalidQuantity();
    error InsufficientGold();
    error InvalidLevel();

    /**
     * @dev Standard function to claim rewards - no special authorization logic here!
     * The EIP-7702 delegation makes the EOA "act" like GhostSessionDelegate without changing the EOA address.
     * @param itemId The ID of the item to mint
     * @param goldReward The amount of gold to award
     */
    function claimReward(uint256 itemId, uint256 goldReward) external {
        if (itemId == 0) revert InvalidItemId();
        
        PlayerStats storage player = players[msg.sender];
        
        // Update player inventory
        player.inventory[itemId] = true;
        player.itemQuantities[itemId] += 1;
        
        // Award gold
        player.gold += goldReward;
        
        emit ItemMinted(msg.sender, itemId, 1);
        emit GoldEarned(msg.sender, goldReward);
    }

    /**
     * @dev Mint multiple items to player inventory
     * @param itemId The ID of the item to mint
     * @param quantity The quantity to mint
     */
    function mintItem(uint256 itemId, uint256 quantity) external {
        if (itemId == 0) revert InvalidItemId();
        if (quantity == 0) revert InvalidQuantity();
        
        PlayerStats storage player = players[msg.sender];
        
        player.inventory[itemId] = true;
        player.itemQuantities[itemId] += quantity;
        
        emit ItemMinted(msg.sender, itemId, quantity);
    }

    /**
     * @dev Award experience points to player
     * @param expAmount The amount of experience to award
     */
    function gainExperience(uint256 expAmount) external {
        if (expAmount == 0) return;
        
        PlayerStats storage player = players[msg.sender];
        player.experience += expAmount;
        
        // Simple level calculation: level = experience / 1000
        uint256 newLevel = player.experience / 1000;
        if (newLevel > player.level) {
            player.level = newLevel;
            emit LevelUp(msg.sender, newLevel);
        }
        
        emit ExperienceGained(msg.sender, expAmount);
    }

    /**
     * @dev Update complete player state (for complex game actions)
     * @param newLevel The new player level
     * @param newExp The new experience amount
     * @param goldChange The change in gold (can be negative for spending)
     */
    function updatePlayerState(uint256 newLevel, uint256 newExp, int256 goldChange) external {
        PlayerStats storage player = players[msg.sender];
        
        // Validate level progression
        if (newLevel < player.level) revert InvalidLevel();
        
        // Update level and experience
        if (newLevel > player.level) {
            player.level = newLevel;
            emit LevelUp(msg.sender, newLevel);
        }
        
        if (newExp != player.experience) {
            player.experience = newExp;
            emit ExperienceGained(msg.sender, newExp > player.experience ? newExp - player.experience : 0);
        }
        
        // Handle gold changes
        if (goldChange > 0) {
            player.gold += uint256(goldChange);
            emit GoldEarned(msg.sender, uint256(goldChange));
        } else if (goldChange < 0) {
            uint256 goldToSpend = uint256(-goldChange);
            if (player.gold < goldToSpend) revert InsufficientGold();
            player.gold -= goldToSpend;
        }
        
        emit PlayerStateUpdated(msg.sender, player.level, player.experience, player.gold);
    }

    /**
     * @dev Batch operation for multiple rewards (gas efficient)
     * @param itemIds Array of item IDs to mint
     * @param quantities Array of quantities for each item
     * @param goldReward Total gold reward
     * @param expReward Total experience reward
     */
    function batchClaimRewards(
        uint256[] calldata itemIds,
        uint256[] calldata quantities,
        uint256 goldReward,
        uint256 expReward
    ) external {
        if (itemIds.length != quantities.length) revert InvalidQuantity();
        
        PlayerStats storage player = players[msg.sender];
        
        // Process items
        for (uint256 i = 0; i < itemIds.length; i++) {
            if (itemIds[i] == 0) revert InvalidItemId();
            if (quantities[i] == 0) revert InvalidQuantity();
            
            player.inventory[itemIds[i]] = true;
            player.itemQuantities[itemIds[i]] += quantities[i];
            
            emit ItemMinted(msg.sender, itemIds[i], quantities[i]);
        }
        
        // Award gold
        if (goldReward > 0) {
            player.gold += goldReward;
            emit GoldEarned(msg.sender, goldReward);
        }
        
        // Award experience
        if (expReward > 0) {
            player.experience += expReward;
            
            uint256 newLevel = player.experience / 1000;
            if (newLevel > player.level) {
                player.level = newLevel;
                emit LevelUp(msg.sender, newLevel);
            }
            
            emit ExperienceGained(msg.sender, expReward);
        }
    }

    // View functions for reading player state
    
    /**
     * @dev Get player's basic stats
     */
    function getPlayerStats(address player) external view returns (uint256 gold, uint256 experience, uint256 level) {
        PlayerStats storage playerStats = players[player];
        return (playerStats.gold, playerStats.experience, playerStats.level);
    }

    /**
     * @dev Check if player owns a specific item
     */
    function hasItem(address player, uint256 itemId) external view returns (bool) {
        return players[player].inventory[itemId];
    }

    /**
     * @dev Get quantity of a specific item owned by player
     */
    function getItemQuantity(address player, uint256 itemId) external view returns (uint256) {
        return players[player].itemQuantities[itemId];
    }
}