// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TeamLeaderNFT is ERC721, Ownable {
    uint256 private _tokenIds;
    
    // Team Leader pricing and metadata
    uint256 public constant LEADER_PRICE = 0.01 ether; // 0.01 MNT
    uint256 public constant MAX_LEADERS = 1000;
    
    struct LeaderData {
        string characterName;
        uint256 purchaseTime;
        uint256 battlesWon;
        uint256 totalDamage;
        bool isActive;
    }
    
    mapping(uint256 => LeaderData) public leaders;
    mapping(address => uint256[]) public ownerToTokens;
    mapping(address => bool) public hasActiveLeader;
    
    // Events
    event LeaderPurchased(address indexed buyer, uint256 tokenId, string character);
    event LeaderActivated(address indexed owner, uint256 tokenId);
    event BattleCompleted(uint256 indexed tokenId, uint256 damage, bool won);
    
    constructor() ERC721("StrangerThings Team Leader", "STTL") Ownable(msg.sender) {}
    
    function purchaseLeader(string memory characterName) external payable {
        require(msg.value >= LEADER_PRICE, "Insufficient payment");
        require(_tokenIds < MAX_LEADERS, "Max leaders reached");
        require(bytes(characterName).length > 0, "Character name required");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(msg.sender, newTokenId);
        
        leaders[newTokenId] = LeaderData({
            characterName: characterName,
            purchaseTime: block.timestamp,
            battlesWon: 0,
            totalDamage: 0,
            isActive: false
        });
        
        ownerToTokens[msg.sender].push(newTokenId);
        
        emit LeaderPurchased(msg.sender, newTokenId, characterName);
    }
    
    function activateLeader(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(!hasActiveLeader[msg.sender], "Already has active leader");
        
        leaders[tokenId].isActive = true;
        hasActiveLeader[msg.sender] = true;
        
        emit LeaderActivated(msg.sender, tokenId);
    }
    
    function deactivateLeader(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(leaders[tokenId].isActive, "Leader not active");
        
        leaders[tokenId].isActive = false;
        hasActiveLeader[msg.sender] = false;
    }
    
    function recordBattle(uint256 tokenId, uint256 damage, bool won) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        leaders[tokenId].totalDamage += damage;
        if (won) {
            leaders[tokenId].battlesWon++;
        }
        
        emit BattleCompleted(tokenId, damage, won);
    }
    
    function getLeaderData(uint256 tokenId) external view returns (LeaderData memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return leaders[tokenId];
    }
    
    function getOwnerTokens(address owner) external view returns (uint256[] memory) {
        return ownerToTokens[owner];
    }
    
    function getActiveLeader(address owner) external view returns (uint256) {
        uint256[] memory tokens = ownerToTokens[owner];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (leaders[tokens[i]].isActive) {
                return tokens[i];
            }
        }
        return 0; // No active leader
    }
    
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    function totalSupply() external view returns (uint256) {
        return _tokenIds;
    }
}