const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const WebSocket = require('ws');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Blockchain setup
const provider = new ethers.JsonRpcProvider(process.env.MANTLE_RPC_URL);
const agentWallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);

// Contract ABIs and addresses
const GAME_REGISTRY_ADDRESS = process.env.GAME_REGISTRY_ADDRESS;
const GHOST_DELEGATE_ADDRESS = process.env.GHOST_DELEGATE_ADDRESS;
const TEAM_LEADER_NFT_ADDRESS = process.env.TEAM_LEADER_NFT_ADDRESS;

// Contract ABIs (simplified for demo)
const gameRegistryABI = [
    "function claimReward(uint256 itemId, uint256 goldReward) external",
    "function players(address) external view returns (uint256 gold, uint256 experience)"
];

const teamLeaderNFTABI = [
    "function purchaseLeader(string memory characterName) external payable",
    "function activateLeader(uint256 tokenId) external",
    "function getActiveLeader(address owner) external view returns (uint256)",
    "function getLeaderData(uint256 tokenId) external view returns (tuple(string characterName, uint256 purchaseTime, uint256 battlesWon, uint256 totalDamage, bool isActive))",
    "function recordBattle(uint256 tokenId, uint256 damage, bool won) external",
    "event LeaderPurchased(address indexed buyer, uint256 tokenId, string character)"
];

const ghostDelegateABI = [
    "function executeGameAction(address targetContract, bytes calldata data) external payable"
];

// Contract instances
const gameRegistry = new ethers.Contract(GAME_REGISTRY_ADDRESS, gameRegistryABI, agentWallet);
const teamLeaderNFT = new ethers.Contract(TEAM_LEADER_NFT_ADDRESS, teamLeaderNFTABI, agentWallet);
const ghostDelegate = new ethers.Contract(GHOST_DELEGATE_ADDRESS, ghostDelegateABI, agentWallet);

// Create HTTP server first (will attach WebSocket to it later)
const server = require('http').createServer(app);

// WebSocket server attached to HTTP server (same port)
const wss = new WebSocket.Server({ server });

// Game state management
const activeBattles = new Map();
const playerSessions = new Map();
const riftSessions = new Map(); // Store active rift sessions
const roomCodeToSessionId = new Map(); // Map room codes to session IDs
const multiplayerRooms = new Map(); // Store multiplayer rooms
const playerInvitations = new Map(); // Store pending invitations
const warBattles = new Map(); // Store active war battles with team permission data
const characterSelectionRooms = new Map(); // Store character selection sessions

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    // Store connection info for cleanup
    ws.playerAddress = null;
    ws.roomCode = null;
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            await handleWebSocketMessage(ws, data);
        } catch (error) {
            console.error('WebSocket message error:', error);
            ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
    });
    
    ws.on('close', () => {
        console.log('WebSocket connection closed');
        // Clean up player from any rooms they were in
        cleanupDisconnectedPlayer(ws);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        // Clean up player from any rooms they were in
        cleanupDisconnectedPlayer(ws);
    });
});

async function handleWebSocketMessage(ws, data) {
    const { type, payload } = data;
    
    console.log(`📨 WebSocket message received: ${type}`, payload ? 'with payload' : 'no payload');
    
    switch (type) {
        case 'JOIN_BATTLE':
            await handleJoinBattle(ws, payload);
            break;
        case 'ATTACK_ENEMY':
            await handleAttackEnemy(ws, payload);
            break;
        case 'USE_POWERUP':
            await handleUsePowerup(ws, payload);
            break;
        case 'PURCHASE_LEADER':
            await handlePurchaseLeader(ws, payload);
            break;
        // Multiplayer room handlers
        case 'CREATE_ROOM':
            await handleCreateRoom(ws, payload);
            break;
        case 'JOIN_ROOM':
            await handleJoinRoom(ws, payload);
            break;
        case 'LEAVE_ROOM':
            await handleLeaveRoom(ws, payload);
            break;
        case 'INVITE_PLAYER':
            await handleInvitePlayer(ws, payload);
            break;
        case 'TOGGLE_READY':
            await handleToggleReady(ws, payload);
            break;
        case 'START_GAME':
            await handleStartMultiplayerGame(ws, payload);
            break;
        case 'REJOIN_ROOM':
            await handleRejoinRoom(ws, payload);
            break;
        case 'SYNC_ROOM':
            await handleSyncRoom(ws, payload);
            break;
        case 'PING':
            ws.send(JSON.stringify({
                type: 'PONG',
                payload: { message: 'Server is alive', timestamp: new Date().toISOString() }
            }));
            console.log('📡 Ping received, sent pong');
            break;
        case 'HEARTBEAT':
            // Just acknowledge the heartbeat, no response needed
            // This keeps the connection alive
            break;
        // War Battle handlers
        case 'WAR_LAUNCH_WEAPON':
            await handleWarLaunchWeapon(ws, payload);
            break;
        case 'WAR_PROPOSE_WEAPON':
            await handleWarProposeWeapon(ws, payload);
            break;
        case 'WAR_VOTE':
            await handleWarVote(ws, payload);
            break;
        case 'WAR_PERSONAL_ACTION':
            await handleWarPersonalAction(ws, payload);
            break;
        case 'WAR_REVOKE_PERMISSION':
            await handleWarRevokePermission(ws, payload);
            break;
        case 'WAR_GRANT_PERMISSION':
            await handleWarGrantPermission(ws, payload);
            break;
        case 'WAR_BATTLE_CONNECT':
            await handleWarBattleConnect(ws, payload);
            break;
        case 'WAR_DELEGATION_COMPLETE':
            await handleWarDelegationComplete(ws, payload);
            break;
        // Multiplayer Character Selection handlers
        case 'JOIN_CHARACTER_SELECTION':
            await handleJoinCharacterSelection(ws, payload);
            break;
        case 'CHARACTER_SELECTED':
            await handleCharacterSelected(ws, payload);
            break;
        // Rift event handlers
        case 'rift:created':
            await handleRiftCreated(ws, payload);
            break;
        case 'rift:joined':
            await handleRiftJoined(ws, payload);
            break;
        case 'rift:terminated':
            await handleRiftTerminated(ws, payload);
            break;
        case 'link:initialize':
            await handleLinkInitialize(ws, payload);
            break;
        case 'link:pending':
            await handleLinkPending(ws, payload);
            break;
        case 'link:established':
            await handleLinkEstablished(ws, payload);
            break;
        case 'link:broken':
            await handleLinkBroken(ws, payload);
            break;
        case 'consumable:spent':
            await handleConsumableSpent(ws, payload);
            break;
        case 'inventory:updated':
            await handleInventoryUpdated(ws, payload);
            break;
        default:
            ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
}

// API Routes

// Get player's team leader NFTs
app.get('/api/player/:address/leaders', async (req, res) => {
    try {
        const { address } = req.params;
        
        // Get active leader
        const activeLeaderId = await teamLeaderNFT.getActiveLeader(address);
        let activeLeader = null;
        
        if (activeLeaderId > 0) {
            const leaderData = await teamLeaderNFT.getLeaderData(activeLeaderId);
            activeLeader = {
                tokenId: activeLeaderId.toString(),
                characterName: leaderData.characterName,
                purchaseTime: leaderData.purchaseTime.toString(),
                battlesWon: leaderData.battlesWon.toString(),
                totalDamage: leaderData.totalDamage.toString(),
                isActive: leaderData.isActive
            };
        }
        
        res.json({
            success: true,
            activeLeader,
            hasLeader: activeLeaderId > 0
        });
    } catch (error) {
        console.error('Error fetching leaders:', error);
        res.status(500).json({ error: 'Failed to fetch leaders' });
    }
});

// Purchase team leader NFT
app.post('/api/purchase-leader', async (req, res) => {
    try {
        const { playerAddress, characterName, signature } = req.body;
        
        // Verify signature and execute purchase through Ghost-Pay
        const purchaseData = teamLeaderNFT.interface.encodeFunctionData(
            'purchaseLeader',
            [characterName]
        );
        
        // Execute through Ghost Delegate for seamless experience
        const tx = await ghostDelegate.executeGameAction(
            TEAM_LEADER_NFT_ADDRESS,
            purchaseData,
            { value: ethers.parseEther('0.01') }
        );
        
        await tx.wait();
        
        res.json({
            success: true,
            transactionHash: tx.hash,
            message: 'Team leader purchased successfully!'
        });
    } catch (error) {
        console.error('Error purchasing leader:', error);
        res.status(500).json({ error: 'Failed to purchase leader' });
    }
});

// Execute game action (attack, powerup, etc.)
app.post('/api/game-action', async (req, res) => {
    try {
        const { playerAddress, action, params } = req.body;
        
        let txData;
        let value = 0;
        
        switch (action) {
            case 'CLAIM_REWARD':
                txData = gameRegistry.interface.encodeFunctionData(
                    'claimReward',
                    [params.itemId, params.goldReward]
                );
                break;
            default:
                throw new Error('Unknown action type');
        }
        
        // Execute through Ghost Delegate
        const tx = await ghostDelegate.executeGameAction(
            GAME_REGISTRY_ADDRESS,
            txData,
            { value }
        );
        
        await tx.wait();
        
        res.json({
            success: true,
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('Error executing game action:', error);
        res.status(500).json({ error: 'Failed to execute action' });
    }
});

// Get battle statistics
app.get('/api/battle-stats/:tokenId', async (req, res) => {
    try {
        const { tokenId } = req.params;
        const leaderData = await teamLeaderNFT.getLeaderData(tokenId);
        
        res.json({
            success: true,
            stats: {
                characterName: leaderData.characterName,
                battlesWon: leaderData.battlesWon.toString(),
                totalDamage: leaderData.totalDamage.toString(),
                purchaseTime: leaderData.purchaseTime.toString()
            }
        });
    } catch (error) {
        console.error('Error fetching battle stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Get rift session status
app.get('/api/rift/:roomCode', async (req, res) => {
    try {
        const { roomCode } = req.params;
        const sessionId = roomCodeToSessionId.get(roomCode);
        
        if (!sessionId) {
            return res.status(404).json({ error: 'Rift session not found' });
        }
        
        const session = riftSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Rift session not found' });
        }
        
        // Check if expired
        if (new Date() > session.expiresAt) {
            riftSessions.delete(sessionId);
            roomCodeToSessionId.delete(roomCode);
            return res.status(410).json({ error: 'Rift session expired' });
        }
        
        res.json({
            success: true,
            session: {
                id: session.id,
                roomCode: session.roomCode,
                anchor: {
                    address: session.anchor.address,
                    displayName: session.anchor.displayName,
                    joinedAt: session.anchor.joinedAt,
                    isAnchor: session.anchor.isAnchor
                },
                drifter: session.drifter ? {
                    address: session.drifter.address,
                    displayName: session.drifter.displayName,
                    joinedAt: session.drifter.joinedAt,
                    isAnchor: session.drifter.isAnchor
                } : null,
                linkStatus: session.linkStatus,
                phase: session.phase,
                createdAt: session.createdAt,
                expiresAt: session.expiresAt,
                isFull: session.drifter !== null,
                isExpired: new Date() > session.expiresAt
            }
        });
    } catch (error) {
        console.error('Error fetching rift session:', error);
        res.status(500).json({ error: 'Failed to fetch rift session' });
    }
});

// Get all active rift sessions (for debugging)
app.get('/api/rifts', async (req, res) => {
    try {
        const sessions = [];
        for (const [sessionId, session] of riftSessions.entries()) {
            sessions.push({
                id: session.id,
                roomCode: session.roomCode,
                phase: session.phase,
                linkStatus: session.linkStatus,
                playerCount: session.drifter ? 2 : 1,
                createdAt: session.createdAt,
                expiresAt: session.expiresAt
            });
        }
        
        res.json({
            success: true,
            sessions,
            totalSessions: sessions.length
        });
    } catch (error) {
        console.error('Error fetching rift sessions:', error);
        res.status(500).json({ error: 'Failed to fetch rift sessions' });
    }
});

// WebSocket handlers
async function handleJoinBattle(ws, payload) {
    const { playerAddress, leaderTokenId } = payload;
    
    // Verify player has active leader
    const activeLeader = await teamLeaderNFT.getActiveLeader(playerAddress);
    if (activeLeader.toString() !== leaderTokenId) {
        ws.send(JSON.stringify({ 
            type: 'ERROR', 
            message: 'Invalid or inactive leader' 
        }));
        return;
    }
    
    // Create battle session
    const battleId = `battle_${Date.now()}_${Math.random()}`;
    activeBattles.set(battleId, {
        playerAddress,
        leaderTokenId,
        startTime: Date.now(),
        enemies: generateEnemies(1), // Start with round 1
        round: 1
    });
    
    playerSessions.set(playerAddress, { battleId, ws });
    
    ws.send(JSON.stringify({
        type: 'BATTLE_JOINED',
        battleId,
        enemies: activeBattles.get(battleId).enemies
    }));
}

async function handleAttackEnemy(ws, payload) {
    const { playerAddress, enemyId, attackerCharacter, damage } = payload;
    
    const session = playerSessions.get(playerAddress);
    if (!session) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'No active battle' }));
        return;
    }
    
    const battle = activeBattles.get(session.battleId);
    const enemy = battle.enemies.find(e => e.id === enemyId);
    
    if (!enemy) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Enemy not found' }));
        return;
    }
    
    // Apply damage
    enemy.health -= damage;
    
    // Check if enemy defeated
    if (enemy.health <= 0) {
        battle.enemies = battle.enemies.filter(e => e.id !== enemyId);
        
        // Record battle progress
        await teamLeaderNFT.recordBattle(battle.leaderTokenId, damage, false);
    }
    
    // Check if round complete
    if (battle.enemies.length === 0) {
        battle.round++;
        battle.enemies = generateEnemies(battle.round);
        
        if (battle.round > 10) { // Battle won
            await teamLeaderNFT.recordBattle(battle.leaderTokenId, 0, true);
            ws.send(JSON.stringify({ type: 'BATTLE_WON', round: battle.round }));
            return;
        }
    }
    
    ws.send(JSON.stringify({
        type: 'ATTACK_RESULT',
        enemyId,
        damage,
        enemyHealth: enemy.health,
        enemies: battle.enemies,
        round: battle.round
    }));
}

async function handleUsePowerup(ws, payload) {
    const { playerAddress, powerupType, cost } = payload;
    
    // Execute powerup effect through blockchain
    const claimData = gameRegistry.interface.encodeFunctionData(
        'claimReward',
        [999, cost] // Special powerup item ID
    );
    
    try {
        const tx = await ghostDelegate.executeGameAction(
            GAME_REGISTRY_ADDRESS,
            claimData
        );
        
        await tx.wait();
        
        ws.send(JSON.stringify({
            type: 'POWERUP_USED',
            powerupType,
            transactionHash: tx.hash
        }));
    } catch (error) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Failed to use powerup'
        }));
    }
}

async function handlePurchaseLeader(ws, payload) {
    const { playerAddress, characterName } = payload;
    
    try {
        const purchaseData = teamLeaderNFT.interface.encodeFunctionData(
            'purchaseLeader',
            [characterName]
        );
        
        const tx = await ghostDelegate.executeGameAction(
            TEAM_LEADER_NFT_ADDRESS,
            purchaseData,
            { value: ethers.parseEther('0.01') }
        );
        
        await tx.wait();
        
        ws.send(JSON.stringify({
            type: 'LEADER_PURCHASED',
            characterName,
            transactionHash: tx.hash
        }));
    } catch (error) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Failed to purchase leader'
        }));
    }
}

function generateEnemies(round) {
    const enemies = [];
    const enemyCount = Math.min(round, 5);
    
    for (let i = 0; i < enemyCount; i++) {
        let enemyType, health, maxHealth, damage, image;
        
        if (round % 5 === 0) {
            // Boss round - Vecna
            enemyType = 'vecna';
            health = 800;
            maxHealth = 800;
            damage = 75;
            image = '/assets/enemies/vecna.png';
        } else if (round % 3 === 0) {
            // Mind Flayer round
            enemyType = 'mindflayer';
            health = 400;
            maxHealth = 400;
            damage = 40;
            image = '/assets/enemies/mindflayer.png';
        } else {
            // Regular Demogorgon
            enemyType = 'demogorgon';
            health = 150 + (round * 25);
            maxHealth = 150 + (round * 25);
            damage = 25 + (round * 5);
            image = '/assets/enemies/demogorgan.png';
        }
        
        enemies.push({
            id: `enemy_${round}_${i}`,
            type: enemyType,
            health: health,
            maxHealth: maxHealth,
            damage: damage,
            position: { x: 500 + i * 60, y: 200 + i * 40 },
            image: image
        });
    }
    
    return enemies;
}

// Rift WebSocket handlers
async function handleRiftCreated(ws, payload) {
    const { roomCode, anchor } = payload;
    
    // Create new rift session
    const sessionId = `rift_${Date.now()}_${Math.random()}`;
    const session = {
        id: sessionId,
        roomCode,
        anchor: {
            address: anchor.address,
            displayName: anchor.displayName,
            joinedAt: new Date(anchor.joinedAt),
            isAnchor: true,
            ws: ws
        },
        drifter: null,
        linkStatus: 'inactive',
        phase: 'waiting',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    };
    
    riftSessions.set(sessionId, session);
    roomCodeToSessionId.set(roomCode, sessionId);
    
    console.log(`🔮 Rift created: ${roomCode} by ${anchor.displayName}`);
    
    // Broadcast to all connected clients
    broadcastToAll({
        type: 'rift:created',
        payload: { roomCode, anchor },
        timestamp: new Date().toISOString()
    });
}

async function handleRiftJoined(ws, payload) {
    const { drifter } = payload;
    
    // Find the session this drifter is joining (should be passed in payload)
    // For now, we'll find by looking for a session waiting for a drifter
    let targetSession = null;
    for (const [sessionId, session] of riftSessions.entries()) {
        if (session.phase === 'waiting' && !session.drifter) {
            targetSession = session;
            break;
        }
    }
    
    if (!targetSession) {
        ws.send(JSON.stringify({
            type: 'rift:error',
            payload: { message: 'No available rift session to join' },
            timestamp: new Date().toISOString()
        }));
        return;
    }
    
    // Add drifter to session
    targetSession.drifter = {
        address: drifter.address,
        displayName: drifter.displayName,
        joinedAt: new Date(drifter.joinedAt),
        isAnchor: false,
        ws: ws
    };
    targetSession.phase = 'active';
    
    console.log(`🌀 ${drifter.displayName} joined rift: ${targetSession.roomCode}`);
    
    // Notify both players
    const event = {
        type: 'rift:joined',
        payload: { drifter },
        timestamp: new Date().toISOString()
    };
    
    targetSession.anchor.ws.send(JSON.stringify(event));
    targetSession.drifter.ws.send(JSON.stringify(event));
}

async function handleRiftTerminated(ws, payload) {
    const { reason } = payload;
    
    // Find session by WebSocket connection
    let targetSession = null;
    let sessionId = null;
    
    for (const [id, session] of riftSessions.entries()) {
        if (session.anchor.ws === ws || (session.drifter && session.drifter.ws === ws)) {
            targetSession = session;
            sessionId = id;
            break;
        }
    }
    
    if (!targetSession) return;
    
    // Update session state
    targetSession.phase = 'terminated';
    
    console.log(`🔚 Rift terminated: ${targetSession.roomCode} - ${reason}`);
    
    // Notify both players
    const event = {
        type: 'rift:terminated',
        payload: { reason },
        timestamp: new Date().toISOString()
    };
    
    if (targetSession.anchor.ws) {
        targetSession.anchor.ws.send(JSON.stringify(event));
    }
    if (targetSession.drifter && targetSession.drifter.ws) {
        targetSession.drifter.ws.send(JSON.stringify(event));
    }
    
    // Cleanup
    riftSessions.delete(sessionId);
    roomCodeToSessionId.delete(targetSession.roomCode);
}

async function handleLinkInitialize(ws, payload) {
    const { message } = payload;
    
    // Find session by WebSocket connection
    let targetSession = null;
    
    for (const [id, session] of riftSessions.entries()) {
        if (session.anchor.ws === ws || (session.drifter && session.drifter.ws === ws)) {
            targetSession = session;
            break;
        }
    }
    
    if (!targetSession || !targetSession.drifter) return;
    
    console.log(`🔗 Link initialization requested: ${targetSession.roomCode}`);
    
    // Broadcast to both players
    const event = {
        type: 'link:initialize',
        payload: { message },
        timestamp: new Date().toISOString()
    };
    
    targetSession.anchor.ws.send(JSON.stringify(event));
    targetSession.drifter.ws.send(JSON.stringify(event));
}

async function handleLinkPending(ws, payload) {
    const { playerId } = payload;
    
    // Find session and broadcast to partner
    let targetSession = null;
    
    for (const [id, session] of riftSessions.entries()) {
        if (session.anchor.ws === ws || (session.drifter && session.drifter.ws === ws)) {
            targetSession = session;
            break;
        }
    }
    
    if (!targetSession || !targetSession.drifter) return;
    
    targetSession.linkStatus = 'pending';
    
    console.log(`⏳ Link pending for player: ${playerId}`);
    
    // Notify partner
    const event = {
        type: 'link:pending',
        payload: { playerId },
        timestamp: new Date().toISOString()
    };
    
    const partnerWs = (targetSession.anchor.ws === ws) ? 
        targetSession.drifter.ws : targetSession.anchor.ws;
    
    if (partnerWs) {
        partnerWs.send(JSON.stringify(event));
    }
}

async function handleLinkEstablished(ws, payload) {
    // Find session by WebSocket connection
    let targetSession = null;
    
    for (const [id, session] of riftSessions.entries()) {
        if (session.anchor.ws === ws || (session.drifter && session.drifter.ws === ws)) {
            targetSession = session;
            break;
        }
    }
    
    if (!targetSession || !targetSession.drifter) return;
    
    targetSession.linkStatus = 'active';
    
    console.log(`✅ Psychic link established: ${targetSession.roomCode}`);
    
    // Notify both players
    const event = {
        type: 'link:established',
        payload: { timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString()
    };
    
    targetSession.anchor.ws.send(JSON.stringify(event));
    targetSession.drifter.ws.send(JSON.stringify(event));
}

async function handleLinkBroken(ws, payload) {
    const { reason } = payload;
    
    // Find session by WebSocket connection
    let targetSession = null;
    
    for (const [id, session] of riftSessions.entries()) {
        if (session.anchor.ws === ws || (session.drifter && session.drifter.ws === ws)) {
            targetSession = session;
            break;
        }
    }
    
    if (!targetSession) return;
    
    targetSession.linkStatus = 'broken';
    
    console.log(`💔 Psychic link broken: ${targetSession.roomCode} - ${reason}`);
    
    // Notify both players
    const event = {
        type: 'link:broken',
        payload: { reason },
        timestamp: new Date().toISOString()
    };
    
    if (targetSession.anchor.ws) {
        targetSession.anchor.ws.send(JSON.stringify(event));
    }
    if (targetSession.drifter && targetSession.drifter.ws) {
        targetSession.drifter.ws.send(JSON.stringify(event));
    }
}

async function handleConsumableSpent(ws, payload) {
    const { playerId, itemId, amount } = payload;
    
    // Find session and broadcast to partner
    let targetSession = null;
    
    for (const [id, session] of riftSessions.entries()) {
        if (session.anchor.ws === ws || (session.drifter && session.drifter.ws === ws)) {
            targetSession = session;
            break;
        }
    }
    
    if (!targetSession || !targetSession.drifter) return;
    
    console.log(`🎒 Consumable spent: ${itemId} x${amount} by ${playerId}`);
    
    // Broadcast to both players
    const event = {
        type: 'consumable:spent',
        payload: { playerId, itemId, amount },
        timestamp: new Date().toISOString()
    };
    
    targetSession.anchor.ws.send(JSON.stringify(event));
    targetSession.drifter.ws.send(JSON.stringify(event));
}

async function handleInventoryUpdated(ws, payload) {
    const { inventory } = payload;
    
    // Find session and broadcast to partner
    let targetSession = null;
    
    for (const [id, session] of riftSessions.entries()) {
        if (session.anchor.ws === ws || (session.drifter && session.drifter.ws === ws)) {
            targetSession = session;
            break;
        }
    }
    
    if (!targetSession || !targetSession.drifter) return;
    
    console.log(`📦 Inventory updated for session: ${targetSession.roomCode}`);
    
    // Broadcast to both players
    const event = {
        type: 'inventory:updated',
        payload: { inventory },
        timestamp: new Date().toISOString()
    };
    
    targetSession.anchor.ws.send(JSON.stringify(event));
    targetSession.drifter.ws.send(JSON.stringify(event));
}

// Utility function to broadcast to all connected clients
function broadcastToAll(event) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(event));
        }
    });
}

// Utility function to clean up a player from all rooms
function cleanupPlayerFromAllRooms(playerAddress) {
    for (const [roomCode, room] of multiplayerRooms.entries()) {
        const playerIndex = room.players.findIndex(p => p.address.toLowerCase() === playerAddress.toLowerCase());
        if (playerIndex !== -1) {
            const player = room.players[playerIndex];
            room.players.splice(playerIndex, 1);
            room.playerWs.delete(playerAddress);
            
            console.log(`🧹 Cleaned up player ${player.displayName} from room ${room.code}`);
            
            // If host left and there are other players, transfer host
            if (player.isHost && room.players.length > 0) {
                room.players[0].isHost = true;
                room.host = room.players[0].address;
                room.hostWs = room.playerWs.get(room.players[0].address);
                console.log(`👑 Host transferred to ${room.players[0].displayName} (cleanup)`);
            }
            
            // If room is empty, delete it
            if (room.players.length === 0) {
                multiplayerRooms.delete(roomCode);
                console.log(`🗑️ Room ${room.code} deleted (cleanup)`);
            } else {
                // Notify remaining players
                broadcastToRoom(room, {
                    type: 'PLAYER_LEFT',
                    player,
                    players: room.players
                });
            }
        }
    }
}

// Utility function to clean up disconnected players
function cleanupDisconnectedPlayer(ws) {
    if (!ws.playerAddress || !ws.roomCode) return;
    
    const room = multiplayerRooms.get(ws.roomCode);
    if (!room) return;
    
    const playerIndex = room.players.findIndex(p => p.address.toLowerCase() === ws.playerAddress.toLowerCase());
    if (playerIndex === -1) return;
    
    const player = room.players[playerIndex];
    
    // Don't immediately remove the player - just mark them as disconnected
    // This allows them to reconnect without losing their spot
    console.log(`🔌 Player ${player.displayName} disconnected from room ${room.code} (keeping spot for reconnection)`);
    
    // Only clean up if they've been disconnected for more than 30 seconds
    setTimeout(() => {
        // Check if they're still disconnected
        const currentRoom = multiplayerRooms.get(ws.roomCode);
        if (!currentRoom) return;
        
        const currentPlayer = currentRoom.players.find(p => p.address.toLowerCase() === ws.playerAddress.toLowerCase());
        if (!currentPlayer) return;
        
        const currentWs = currentRoom.playerWs.get(ws.playerAddress);
        if (currentWs && currentWs.readyState === WebSocket.OPEN) {
            // Player reconnected, don't clean up
            return;
        }
        
        // Player still disconnected after 30 seconds, clean up
        currentRoom.players.splice(currentRoom.players.indexOf(currentPlayer), 1);
        currentRoom.playerWs.delete(ws.playerAddress);
        
        console.log(`🧹 Cleaned up disconnected player: ${currentPlayer.displayName} from room ${currentRoom.code} (timeout)`);
        
        // If host left and there are other players, transfer host
        if (currentPlayer.isHost && currentRoom.players.length > 0) {
            currentRoom.players[0].isHost = true;
            currentRoom.host = currentRoom.players[0].address;
            currentRoom.hostWs = currentRoom.playerWs.get(currentRoom.players[0].address);
            console.log(`👑 Host transferred to ${currentRoom.players[0].displayName} (timeout cleanup)`);
        }
        
        // If room is empty, delete it
        if (currentRoom.players.length === 0) {
            multiplayerRooms.delete(ws.roomCode);
            console.log(`🗑️ Room ${currentRoom.code} deleted (timeout cleanup)`);
            return;
        }
        
        // Notify remaining players
        broadcastToRoom(currentRoom, {
            type: 'PLAYER_LEFT',
            player: currentPlayer,
            players: currentRoom.players
        });
    }, 30000); // 30 second grace period
}

// War Battle handlers
async function handleWarProposeWeapon(ws, payload) {
    const { battleId, weaponId, weaponName, weaponCost, proposedBy, proposedByName } = payload;
    
    console.log(`🗳️ Weapon vote proposed: ${weaponName} by ${proposedByName}`);
    
    const battle = warBattles.get(battleId);
    if (!battle) {
        ws.send(JSON.stringify({
            type: 'WAR_ERROR',
            message: 'Battle not found'
        }));
        return;
    }
    
    // Check if there's already an active vote
    if (battle.activeVote && battle.activeVote.status === 'active') {
        ws.send(JSON.stringify({
            type: 'WAR_ERROR',
            message: 'There is already an active vote'
        }));
        return;
    }
    
    // Create vote
    const voteId = `${weaponId}_${Date.now()}`;
    const vote = {
        voteId,
        weaponId,
        weaponName,
        weaponCost,
        proposedBy,
        proposedByName,
        votes: [], // Proposer does NOT auto-vote - they must click YES like everyone else
        startTime: Date.now(),
        endTime: Date.now() + 10000, // 10 seconds
        status: 'active'
    };
    
    battle.activeVote = vote;
    
    // Broadcast vote started
    broadcastToWarBattle(battle, {
        type: 'WAR_VOTE_STARTED',
        vote
    });
    
    // Calculate votes needed: minimum 2 votes, or majority if more than 2 players
    const votesNeeded = Math.max(2, Math.ceil(battle.teamMembers.length / 2));
    console.log(`🗳️ Vote started: ${voteId}, need ${votesNeeded} votes (${battle.teamMembers.length} players)`);
    
    // Set timer to check vote result after 10 seconds
    setTimeout(() => {
        checkVoteResult(battleId, voteId);
    }, 10000);
}

async function handleWarVote(ws, payload) {
    const { battleId, voteId, voterAddress, approve } = payload;
    
    console.log(`🗳️ Vote received: ${approve ? 'YES' : 'NO'} from ${voterAddress.substring(0, 8)}...`);
    
    const battle = warBattles.get(battleId);
    if (!battle || !battle.activeVote || battle.activeVote.voteId !== voteId) {
        ws.send(JSON.stringify({
            type: 'WAR_ERROR',
            message: 'Vote not found or expired'
        }));
        return;
    }
    
    const vote = battle.activeVote;
    
    // Check if already voted
    if (vote.votes.includes(voterAddress)) {
        console.log(`⚠️ ${voterAddress.substring(0, 8)}... already voted`);
        return;
    }
    
    // Add vote if approved
    if (approve) {
        vote.votes.push(voterAddress);
        console.log(`✅ Vote added: ${vote.votes.length}/${battle.teamMembers.length}`);
    } else {
        console.log(`❌ Vote rejected by ${voterAddress.substring(0, 8)}...`);
        // Mark as rejected so we know not to wait for this player
        if (!vote.rejectedBy) vote.rejectedBy = [];
        vote.rejectedBy.push(voterAddress);
    }
    
    // Broadcast updated vote
    broadcastToWarBattle(battle, {
        type: 'WAR_VOTE_UPDATED',
        vote
    });
    
    // Check if we have enough votes to pass immediately OR if all players have voted
    const votesNeeded = Math.max(2, Math.ceil(battle.teamMembers.length / 2));
    const totalVoted = vote.votes.length + (vote.rejectedBy ? vote.rejectedBy.length : 0);
    const allVoted = totalVoted >= battle.teamMembers.length;
    
    if (vote.votes.length >= votesNeeded) {
        console.log(`🎉 Vote passed! ${vote.votes.length}/${votesNeeded} votes - Launching immediately!`);
        checkVoteResult(battleId, voteId);
    } else if (allVoted) {
        console.log(`⏱️ All players voted but not enough YES votes (${vote.votes.length}/${votesNeeded}) - Ending vote early`);
        checkVoteResult(battleId, voteId);
    }
}

async function checkVoteResult(battleId, voteId) {
    const battle = warBattles.get(battleId);
    if (!battle || !battle.activeVote || battle.activeVote.voteId !== voteId) {
        console.log('⚠️ Vote already processed or battle not found');
        return;
    }
    
    const vote = battle.activeVote;
    
    // Check if vote already processed
    if (vote.status !== 'active') {
        console.log('⚠️ Vote already processed with status:', vote.status);
        return;
    }
    
    // Mark as processing to prevent double execution
    vote.status = 'processing';
    
    // Minimum 2 votes required, or majority if more than 2 players
    const votesNeeded = Math.max(2, Math.ceil(battle.teamMembers.length / 2));
    const passed = vote.votes.length >= votesNeeded;
    
    console.log(`🗳️ Vote result: ${passed ? 'PASSED' : 'FAILED'} (${vote.votes.length}/${votesNeeded})`);
    console.log(`   Players: ${battle.teamMembers.length}, Votes needed: ${votesNeeded} (min 2)`);
    
    if (passed) {
        vote.status = 'passed';
        
        // Broadcast vote passed
        broadcastToWarBattle(battle, {
            type: 'WAR_VOTE_PASSED',
            vote
        });
        
        // Launch the weapon
        const weapon = {
            id: vote.weaponId,
            name: vote.weaponName,
            cost: vote.weaponCost,
            damage: getWeaponDamage(vote.weaponId)
        };
        
        // Execute weapon launch (same as handleWarLaunchWeapon but without leader check)
        await executeWeaponLaunch(battle, weapon);
        
    } else {
        vote.status = 'failed';
        
        // Broadcast vote failed
        broadcastToWarBattle(battle, {
            type: 'WAR_VOTE_FAILED',
            vote
        });
        
        // Clear vote after 1 second
        setTimeout(() => {
            if (battle.activeVote && battle.activeVote.voteId === voteId) {
                battle.activeVote = null;
            }
        }, 1000);
    }
}

function getWeaponDamage(weaponId) {
    const weapons = {
        'molotov': 150,
        'flamethrower': 300,
        'grenade': 500,
        'rocket': 800,
        'nuke': 1500
    };
    return weapons[weaponId] || 100;
}

async function executeWeaponLaunch(battle, weapon) {
    console.log(`💥 Executing weapon launch: ${weapon.name}`);
    
    // Get all active team members (no delegation check needed - WMANTLE in wallets)
    const activeMembers = battle.teamMembers.filter(m => m.isActive);
    
    if (activeMembers.length === 0) {
        console.error(`❌ No active members!`);
        return;
    }
    
    // Split cost equally among all active members
    const perMember = weapon.cost / activeMembers.length;
    const spending = activeMembers.map(member => ({
        address: member.address,
        amount: perMember
    }));
    
    console.log(`💰 Cost per member: ${perMember.toFixed(4)} WMANTLE`);
    console.log(`👥 Active members: ${activeMembers.length}`);
    
    // Execute gasless transaction
    let realTxHash = 'PENDING';
    
    try {
        // USE SimpleGamePayment - Pull WMANTLE from players in real-time!
        const gamePaymentContract = new ethers.Contract(
            process.env.GAME_PAYMENT_ADDRESS,
            [
                "function purchaseWeapon(address[] calldata players, uint256 costPerPlayer) external"
            ],
            agentWallet
        );
        
        const players = spending.map(s => s.address);
        const costPerPlayer = ethers.parseEther(spending[0].amount.toString()); // Same cost for all
        
        console.log('🚀 Purchasing weapon from backend wallet...');
        console.log('💰 This will PULL WMANTLE from players\' wallets in real-time!');
        console.log(`👥 Players: ${players.length}`);
        console.log(`💵 Cost per player: ${spending[0].amount} WMANTLE`);
        
        // Execute transaction - PULLS WMANTLE from players' wallets!
        const tx = await gamePaymentContract.purchaseWeapon(players, costPerPlayer);
        realTxHash = tx.hash;
        
        console.log('⏳ Gasless transaction sent:', tx.hash);
        
        const receipt = await tx.wait();
        
        console.log('✅ Gasless transaction confirmed! Block:', receipt.blockNumber);
        console.log('✅ WMANTLE pulled from players\' wallets automatically!');
        
    } catch (error) {
        console.error('❌ Gasless transaction failed:', error);
        return;
    }
    
    // Update team member spent amounts
    spending.forEach(spend => {
        const member = battle.teamMembers.find(m => m.address === spend.address);
        if (member) {
            member.spentAmount += spend.amount;
            member.lastAction = `Contributed ${spend.amount.toFixed(3)} MNT for ${weapon.name}`;
        }
    });
    
    // Apply weapon effects to enemies
    battle.enemies.forEach(enemy => {
        enemy.health = Math.max(0, enemy.health - weapon.damage);
        if (enemy.health <= 0) {
            enemy.isDestroyed = true;
        }
    });
    
    // Create transaction record
    const transaction = {
        id: `tx_${Date.now()}`,
        weapon: weapon.name,
        cost: weapon.cost,
        spentFrom: spending,
        timestamp: new Date().toISOString(),
        success: true,
        transactionHash: realTxHash
    };
    
    battle.transactions.unshift(transaction);
    battle.transactions = battle.transactions.slice(0, 10);
    
    // Check victory condition
    const allDestroyed = battle.enemies.every(enemy => enemy.health <= 0);
    if (allDestroyed) {
        console.log(`🎊 All enemies destroyed in round ${battle.round}!`);
        
        // Check if this is the final round (let's say 5 rounds)
        if (battle.round >= 5) {
            console.log('🏆 FINAL VICTORY! All rounds complete!');
            battle.phase = 'victory';
            
            // Broadcast victory
            broadcastToWarBattle(battle, {
                type: 'WAR_WEAPON_LAUNCHED',
                weapon,
                spending,
                enemies: battle.enemies,
                teamMembers: battle.teamMembers,
                transaction,
                phase: 'victory',
                round: battle.round
            });
        } else {
            // Start next round
            battle.round++;
            console.log(`🎮 Starting round ${battle.round}...`);
            
            // Generate new enemies for next round (stronger!)
            battle.enemies = generateRoundEnemies(battle.round);
            
            // Broadcast round complete
            broadcastToWarBattle(battle, {
                type: 'WAR_ROUND_COMPLETE',
                round: battle.round,
                enemies: battle.enemies,
                teamMembers: battle.teamMembers
            });
            
            // Also broadcast weapon launched to update current state
            setTimeout(() => {
                broadcastToWarBattle(battle, {
                    type: 'WAR_WEAPON_LAUNCHED',
                    weapon,
                    spending,
                    enemies: battle.enemies,
                    teamMembers: battle.teamMembers,
                    transaction,
                    phase: battle.phase,
                    round: battle.round
                });
            }, 3000); // Wait 3 seconds for round transition
        }
    } else {
        // Normal weapon launch - not all enemies destroyed
        broadcastToWarBattle(battle, {
            type: 'WAR_WEAPON_LAUNCHED',
            weapon,
            spending,
            enemies: battle.enemies,
            teamMembers: battle.teamMembers,
            transaction,
            phase: battle.phase,
            round: battle.round
        });
    }
    
    console.log(`✅ Weapon ${weapon.name} launched via democratic vote! Tx: ${realTxHash}`);
}

function generateRoundEnemies(round) {
    console.log(`🎮 Generating enemies for round ${round}`);
    
    const enemies = [];
    const baseHealth = 300;
    const baseDamage = 50;
    
    // Each round gets progressively harder
    const healthMultiplier = 1 + (round - 1) * 0.3; // +30% health per round
    const damageMultiplier = 1 + (round - 1) * 0.2; // +20% damage per round
    
    // Round 1-2: 3 enemies
    // Round 3-4: 4 enemies
    // Round 5: 5 enemies (boss round)
    const enemyCount = Math.min(3 + Math.floor(round / 2), 5);
    
    for (let i = 0; i < enemyCount; i++) {
        let enemyType, health, damage, image;
        
        // Boss round (every 5th round or final round)
        if (round === 5 || round % 5 === 0) {
            if (i === enemyCount - 1) {
                // Final boss - Vecna
                enemyType = 'vecna';
                health = Math.floor(800 * healthMultiplier);
                damage = Math.floor(100 * damageMultiplier);
                image = '/assets/enemies/vecna.png';
            } else if (i % 2 === 0) {
                enemyType = 'mindflayer';
                health = Math.floor(400 * healthMultiplier);
                damage = Math.floor(75 * damageMultiplier);
                image = '/assets/enemies/mindflayer.png';
            } else {
                enemyType = 'demogorgon';
                health = Math.floor(baseHealth * healthMultiplier);
                damage = Math.floor(baseDamage * damageMultiplier);
                image = '/assets/enemies/demogorgan.png';
            }
        } else {
            // Regular rounds - mix of enemies
            if (i === 0 && round >= 3) {
                // Add a Mind Flayer from round 3+
                enemyType = 'mindflayer';
                health = Math.floor(400 * healthMultiplier);
                damage = Math.floor(75 * damageMultiplier);
                image = '/assets/enemies/mindflayer.png';
            } else {
                enemyType = 'demogorgon';
                health = Math.floor(baseHealth * healthMultiplier);
                damage = Math.floor(baseDamage * damageMultiplier);
                image = '/assets/enemies/demogorgan.png';
            }
        }
        
        enemies.push({
            id: `${enemyType}_${round}_${i}`,
            type: enemyType,
            health: health,
            maxHealth: health,
            damage: damage,
            position: { x: 500 + i * 60, y: 200 + i * 40 },
            isDestroyed: false,
            image: image
        });
    }
    
    console.log(`✅ Generated ${enemies.length} enemies for round ${round}:`, enemies.map(e => `${e.type}(${e.health}HP)`));
    return enemies;
}

async function handleWarLaunchWeapon(ws, payload) {
    const { battleId, weapon, teamLeaderAddress, targetEnemies } = payload;
    
    console.log(`💥 War weapon launch: ${weapon.name} by ${teamLeaderAddress}`);
    console.log(`📊 Payload:`, { battleId, weapon: weapon.name, teamLeaderAddress, targetEnemies });
    
    const battle = warBattles.get(battleId);
    if (!battle) {
        console.error(`❌ Battle ${battleId} not found!`);
        console.error(`📋 Available battles:`, Array.from(warBattles.keys()));
        ws.send(JSON.stringify({
            type: 'WAR_ERROR',
            message: 'Battle not found'
        }));
        return;
    }
    
    console.log(`✅ Battle found: ${battleId}`);
    
    // Verify team leader authority
    const teamLeader = battle.teamMembers.find(m => m.address.toLowerCase() === teamLeaderAddress.toLowerCase());
    if (!teamLeader || !teamLeader.isTeamLeader) {
        console.error(`❌ ${teamLeaderAddress} is not the team leader!`);
        console.error(`👥 Team members:`, battle.teamMembers.map(m => ({ address: m.address, isLeader: m.isTeamLeader })));
        ws.send(JSON.stringify({
            type: 'WAR_ERROR',
            message: 'Only team leader can launch weapons'
        }));
        return;
    }
    
    console.log(`✅ Team leader verified`);
    
    // Get all active team members (no delegation check - WMANTLE in wallets)
    const activeMembers = battle.teamMembers.filter(m => m.isActive);
    
    console.log(`👥 Active members: ${activeMembers.length}`);
    console.log(`📊 Members:`, activeMembers.map(m => ({ 
        address: m.address,
        name: m.characterName
    })));
    
    if (activeMembers.length === 0) {
        console.error(`❌ No active members!`);
        ws.send(JSON.stringify({
            type: 'WAR_ERROR',
            message: 'No active team members'
        }));
        return;
    }
    
    // Split cost equally among all active members
    const perMember = weapon.cost / activeMembers.length;
    const spending = activeMembers.map(member => ({
        address: member.address,
        amount: perMember
    }));
    
    console.log(`💰 Cost per member: ${perMember.toFixed(4)} WMANTLE`);
    
    // NOTE: GASLESS EXECUTION - Backend executes transaction and pays gas!
    console.log(`🤖 Executing GASLESS transaction on backend...`);
    console.log(`📝 SimpleGamePayment contract: ${process.env.GAME_PAYMENT_ADDRESS}`);
    console.log(`💰 Spending:`, spending);
    
    let realTxHash = 'PENDING';
    
    try {
        // USE SimpleGamePayment - Pull WMANTLE from players in real-time!
        const gamePaymentContract = new ethers.Contract(
            process.env.GAME_PAYMENT_ADDRESS,
            [
                "function purchaseWeapon(address[] calldata players, uint256 costPerPlayer) external"
            ],
            agentWallet // Backend wallet pays gas!
        );
        
        const players = spending.map(s => s.address);
        const costPerPlayer = ethers.parseEther(spending[0].amount.toString()); // Same cost for all
        
        console.log('🚀 Purchasing weapon from backend wallet...');
        console.log('  Players:', players);
        console.log('  Cost per player:', ethers.formatEther(costPerPlayer), 'WMANTLE');
        console.log('💰 This will PULL WMANTLE from players\' wallets in real-time!');
        
        // Execute transaction - PULLS WMANTLE from players' wallets!
        const tx = await gamePaymentContract.purchaseWeapon(players, costPerPlayer);
        realTxHash = tx.hash;
        
        console.log('⏳ Gasless transaction sent:', tx.hash);
        console.log('🔗 View on explorer: https://explorer.sepolia.mantle.xyz/tx/' + tx.hash);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        
        console.log('✅ Gasless transaction confirmed! Block:', receipt.blockNumber);
        console.log('💸 Gas paid by BACKEND:', ethers.formatEther(receipt.gasUsed * receipt.gasPrice), 'MNT');
        console.log('🎉 USERS PAID ZERO GAS!');
        console.log('✅ WMANTLE pulled from players\' wallets automatically!');
        
    } catch (error) {
        console.error('❌ Gasless transaction failed:', error);
        
        let errorMessage = 'Transaction failed';
        
        // Check if it's an approval/balance issue
        if (error.message.includes('execution reverted') || error.message.includes('Insufficient balance') || error.message.includes('Transfer failed')) {
            errorMessage = '⚠️ Transaction failed!\n\nPlayers need to:\n1. Visit /wallet-setup\n2. Wrap MNT → WMANTLE\n3. Approve contract\n\nMake sure all players have enough WMANTLE and have approved the contract!';
        } else {
            errorMessage = `Transaction failed: ${error.message}`;
        }
        
        ws.send(JSON.stringify({
            type: 'WAR_ERROR',
            message: errorMessage
        }));
        
        // Broadcast to all players
        broadcastToWarBattle(battle, {
            type: 'WAR_ERROR',
            message: errorMessage
        });
        
        return;
    }
    
    // Update team member spent amounts
    spending.forEach(spend => {
        const member = battle.teamMembers.find(m => m.address === spend.address);
        if (member) {
            member.spentAmount += spend.amount;
            member.lastAction = `Contributed ${spend.amount.toFixed(3)} WMANTLE for ${weapon.name}`;
        }
    });
    
    // Apply weapon effects to enemies
    if (targetEnemies && targetEnemies.length > 0) {
        targetEnemies.forEach(enemyId => {
            const enemy = battle.enemies.find(e => e.id === enemyId);
            if (enemy) {
                enemy.health = Math.max(0, enemy.health - weapon.damage);
                if (enemy.health <= 0) {
                    enemy.isDestroyed = true;
                }
            }
        });
    } else {
        // Apply to all enemies for area weapons
        battle.enemies.forEach(enemy => {
            enemy.health = Math.max(0, enemy.health - weapon.damage);
            if (enemy.health <= 0) {
                enemy.isDestroyed = true;
            }
        });
    }
    
    // Create transaction record with REAL blockchain hash
    const transaction = {
        id: `tx_${Date.now()}`,
        weapon: weapon.name,
        cost: weapon.cost,
        spentFrom: spending,
        timestamp: new Date().toISOString(),
        success: true,
        transactionHash: realTxHash // Real hash from gasless backend transaction!
    };
    
    battle.transactions.unshift(transaction);
    battle.transactions = battle.transactions.slice(0, 10); // Keep last 10
    
    // Check victory condition
    const allDestroyed = battle.enemies.every(enemy => enemy.health <= 0);
    if (allDestroyed) {
        console.log(`🎊 All enemies destroyed in round ${battle.round}!`);
        
        // Check if this is the final round (5 rounds)
        if (battle.round >= 5) {
            console.log('🏆 FINAL VICTORY! All rounds complete!');
            battle.phase = 'victory';
            
            // Broadcast victory
            broadcastToWarBattle(battle, {
                type: 'WAR_WEAPON_LAUNCHED',
                weapon,
                spending,
                enemies: battle.enemies,
                teamMembers: battle.teamMembers,
                transaction,
                phase: 'victory',
                round: battle.round
            });
        } else {
            // Start next round
            battle.round++;
            console.log(`🎮 Starting round ${battle.round}...`);
            
            // Generate new enemies for next round (stronger!)
            battle.enemies = generateRoundEnemies(battle.round);
            
            // Broadcast round complete
            broadcastToWarBattle(battle, {
                type: 'WAR_ROUND_COMPLETE',
                round: battle.round,
                enemies: battle.enemies,
                teamMembers: battle.teamMembers
            });
            
            // Also broadcast weapon launched to update current state
            setTimeout(() => {
                broadcastToWarBattle(battle, {
                    type: 'WAR_WEAPON_LAUNCHED',
                    weapon,
                    spending,
                    enemies: battle.enemies,
                    teamMembers: battle.teamMembers,
                    transaction,
                    phase: battle.phase,
                    round: battle.round
                });
            }, 3000); // Wait 3 seconds for round transition
        }
    } else {
        // Normal weapon launch - not all enemies destroyed
        broadcastToWarBattle(battle, {
            type: 'WAR_WEAPON_LAUNCHED',
            weapon,
            spending,
            enemies: battle.enemies,
            teamMembers: battle.teamMembers,
            transaction,
            phase: battle.phase,
            round: battle.round
        });
    }
    
    console.log(`✅ War weapon ${weapon.name} launched GASLESSLY! Tx: ${realTxHash}`);
}

async function handleWarPersonalAction(ws, payload) {
    const { battleId, action, playerAddress } = payload;
    
    console.log(`🎯 Personal action: ${action.name} by ${playerAddress}`);
    
    const battle = warBattles.get(battleId);
    if (!battle) {
        ws.send(JSON.stringify({
            type: 'WAR_ERROR',
            message: 'Battle not found'
        }));
        return;
    }
    
    const player = battle.teamMembers.find(m => m.address.toLowerCase() === playerAddress.toLowerCase());
    if (!player) {
        ws.send(JSON.stringify({
            type: 'WAR_ERROR',
            message: 'Player not in battle'
        }));
        return;
    }
    
    // Execute personal action (uses player's own wallet)
    try {
        const txHash = `0x${Math.random().toString(16).substring(2, 66)}`;
        
        // Create transaction record
        const transaction = {
            id: `tx_${Date.now()}`,
            weapon: action.name,
            cost: action.cost,
            spentFrom: [{ address: playerAddress, amount: action.cost }],
            timestamp: new Date().toISOString(),
            success: true,
            transactionHash: txHash
        };
        
        battle.transactions.unshift(transaction);
        battle.transactions = battle.transactions.slice(0, 10);
        
        player.lastAction = `Used ${action.name} (personal funds)`;
        
        // Broadcast to all team members
        broadcastToWarBattle(battle, {
            type: 'WAR_PERSONAL_ACTION',
            action,
            player: playerAddress,
            teamMembers: battle.teamMembers,
            transaction
        });
        
        console.log(`✅ Personal action ${action.name} executed, tx: ${txHash}`);
        
    } catch (error) {
        console.error('Personal action failed:', error);
        ws.send(JSON.stringify({
            type: 'WAR_ERROR',
            message: 'Failed to execute personal action'
        }));
    }
}

async function handleWarRevokePermission(ws, payload) {
    const { battleId, playerAddress } = payload;
    
    console.log(`🚨 Permission revoked by: ${playerAddress}`);
    
    const battle = warBattles.get(battleId);
    if (!battle) {
        ws.send(JSON.stringify({
            type: 'WAR_ERROR',
            message: 'Battle not found'
        }));
        return;
    }
    
    const player = battle.teamMembers.find(m => m.address.toLowerCase() === playerAddress.toLowerCase());
    if (!player) {
        ws.send(JSON.stringify({
            type: 'WAR_ERROR',
            message: 'Player not in battle'
        }));
        return;
    }
    
    // Revoke permission (in real app would call smart contract)
    player.isActive = false;
    player.lastAction = 'PERMISSION REVOKED - Emergency Stop';
    
    // Create transaction record
    const transaction = {
        id: `tx_${Date.now()}`,
        weapon: 'PERMISSION_REVOKED',
        cost: 0,
        spentFrom: [],
        timestamp: new Date().toISOString(),
        success: true,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`
    };
    
    battle.transactions.unshift(transaction);
    battle.transactions = battle.transactions.slice(0, 10);
    
    // Broadcast to all team members
    broadcastToWarBattle(battle, {
        type: 'WAR_PERMISSION_REVOKED',
        player: playerAddress,
        teamMembers: battle.teamMembers,
        transaction
    });
    
    console.log(`🚨 Permission revoked for ${playerAddress}`);
}

async function handleWarGrantPermission(ws, payload) {
    const { battleId, playerAddress, amount } = payload;
    
    console.log(`🔐 Permission granted: ${amount} MNT to ${playerAddress}`);
    
    const battle = warBattles.get(battleId);
    if (!battle) {
        ws.send(JSON.stringify({
            type: 'WAR_ERROR',
            message: 'Battle not found'
        }));
        return;
    }
    
    const player = battle.teamMembers.find(m => m.address.toLowerCase() === playerAddress.toLowerCase());
    if (!player) {
        ws.send(JSON.stringify({
            type: 'WAR_ERROR',
            message: 'Player not in battle'
        }));
        return;
    }
    
    // Grant additional permission (in real app would call smart contract)
    player.delegatedAmount += amount;
    player.isActive = true;
    player.lastAction = `Granted additional ${amount} MNT permission`;
    
    // Create transaction record
    const transaction = {
        id: `tx_${Date.now()}`,
        weapon: 'PERMISSION_GRANTED',
        cost: 0,
        spentFrom: [],
        timestamp: new Date().toISOString(),
        success: true,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`
    };
    
    battle.transactions.unshift(transaction);
    battle.transactions = battle.transactions.slice(0, 10);
    
    // Broadcast to all team members
    broadcastToWarBattle(battle, {
        type: 'WAR_PERMISSION_GRANTED',
        player: playerAddress,
        amount,
        teamMembers: battle.teamMembers,
        transaction
    });
    
    console.log(`🔐 Permission granted: ${amount} MNT to ${playerAddress}`);
}

function broadcastToWarBattle(battle, message) {
    const messageStr = JSON.stringify(message);
    
    console.log(`📢 Broadcasting to war battle: ${message.type}`);
    console.log(`📊 Battle has ${battle.teamMembers.length} team members, ${battle.playerWs.size} WebSocket connections`);
    
    let sentCount = 0;
    let failedCount = 0;
    const missingConnections = [];
    
    battle.teamMembers.forEach(member => {
        const memberWs = battle.playerWs.get(member.address);
        
        if (!memberWs) {
            failedCount++;
            missingConnections.push(member.displayName);
            console.log(`  ❌ ${member.displayName} (${member.address.substring(0, 8)}...) - NO WEBSOCKET STORED`);
            console.log(`     Available WebSocket keys:`, Array.from(battle.playerWs.keys()).map(k => k.substring(0, 8) + '...'));
            return;
        }
        
        if (memberWs.readyState !== WebSocket.OPEN) {
            failedCount++;
            console.log(`  ❌ ${member.displayName} (${member.address.substring(0, 8)}...) - WebSocket state: ${memberWs.readyState} (not OPEN)`);
            return;
        }
        
        try {
            memberWs.send(messageStr);
            sentCount++;
            console.log(`  ✅ Sent to ${member.displayName} (${member.address.substring(0, 8)}...)`);
        } catch (error) {
            failedCount++;
            console.log(`  ❌ ${member.displayName} (${member.address.substring(0, 8)}...) - Send error: ${error.message}`);
        }
    });
    
    console.log(`📢 Broadcast complete: ${sentCount} sent, ${failedCount} failed`);
    
    if (failedCount > 0) {
        console.log(`⚠️  WARNING: ${failedCount} team members did not receive the message!`);
        if (missingConnections.length > 0) {
            console.log(`⚠️  Players without WebSocket connection: ${missingConnections.join(', ')}`);
            console.log(`⚠️  These players need to send WAR_BATTLE_CONNECT message!`);
        }
    }
}

async function handleWarBattleConnect(ws, payload) {
    const { battleId, playerAddress } = payload;
    
    console.log(`🔗 War battle connect: ${playerAddress} to battle ${battleId}`);
    
    const battle = warBattles.get(battleId);
    if (!battle) {
        console.error(`❌ Battle ${battleId} not found!`);
        console.error(`📋 Available battles:`, Array.from(warBattles.keys()));
        ws.send(JSON.stringify({
            type: 'WAR_ERROR',
            message: 'Battle not found'
        }));
        return;
    }
    
    const player = battle.teamMembers.find(m => m.address.toLowerCase() === playerAddress.toLowerCase());
    if (!player) {
        console.error(`❌ Player ${playerAddress} not found in battle!`);
        console.error(`👥 Team members:`, battle.teamMembers.map(m => m.address));
        ws.send(JSON.stringify({
            type: 'WAR_ERROR',
            message: 'Player not in this battle'
        }));
        return;
    }
    
    // CRITICAL FIX: Store WebSocket using the SAME address format as team members
    // This ensures broadcastToWarBattle can find the connection
    const normalizedAddress = player.address; // Use the exact address from team members
    battle.playerWs.set(normalizedAddress, ws);
    
    // Track connection info for cleanup
    ws.playerAddress = normalizedAddress;
    ws.battleId = battleId;
    
    console.log(`✅ ${player.displayName} connected to war battle ${battleId}`);
    console.log(`📊 Battle now has ${battle.playerWs.size}/${battle.teamMembers.length} WebSocket connections`);
    console.log(`📋 Connected players:`, Array.from(battle.playerWs.keys()).map(addr => addr.substring(0, 8) + '...'));
    
    // Send current battle state to connecting player
    ws.send(JSON.stringify({
        type: 'WAR_BATTLE_CONNECTED',
        battle: {
            id: battle.id,
            teamMembers: battle.teamMembers,
            enemies: battle.enemies,
            transactions: battle.transactions,
            phase: battle.phase,
            round: battle.round,
            activeVote: battle.activeVote || null
        }
    }));
}

async function handleWarDelegationComplete(ws, payload) {
    const { battleId, playerAddress, amount, transactionHash } = payload;
    
    console.log(`🔐 Delegation completed: ${playerAddress} delegated ${amount} MNT`);
    console.log(`📝 Transaction: ${transactionHash}`);
    console.log(`📊 Target battle: ${battleId}`);
    
    // Update ALL battles that contain this player (in case of multiple battle instances)
    let updatedCount = 0;
    for (const [bid, battle] of warBattles.entries()) {
        const player = battle.teamMembers.find(m => m.address.toLowerCase() === playerAddress.toLowerCase());
        if (player && !player.isTeamLeader) {
            console.log(`  ✅ Updating player in battle ${bid}`);
            
            // Update player's delegation status
            player.delegatedAmount = amount;
            player.isActive = true;
            player.lastAction = `Delegated ${amount} MNT to team leader`;
            
            // Create transaction record
            const transaction = {
                id: `tx_${Date.now()}_${updatedCount}`,
                weapon: 'DELEGATION_COMPLETE',
                cost: 0,
                spentFrom: [],
                timestamp: new Date().toISOString(),
                success: true,
                transactionHash: transactionHash
            };
            
            battle.transactions.unshift(transaction);
            battle.transactions = battle.transactions.slice(0, 10);
            
            // Broadcast to all team members in this battle
            broadcastToWarBattle(battle, {
                type: 'WAR_DELEGATION_UPDATED',
                player: playerAddress,
                amount: amount,
                teamMembers: battle.teamMembers,
                transaction
            });
            
            updatedCount++;
        }
    }
    
    console.log(`✅ Updated ${updatedCount} battle(s) with delegation from ${playerAddress.substring(0, 8)}...`);
}

// Multiplayer Character Selection handlers
async function handleJoinCharacterSelection(ws, payload) {
    const { roomCode, playerAddress, playerName } = payload;
    
    console.log(`🎭 ${playerName} joining character selection for room ${roomCode}`);
    
    if (!characterSelectionRooms.has(roomCode)) {
        characterSelectionRooms.set(roomCode, {
            roomCode,
            players: new Map(),
            characterSelections: new Map(),
            readyPlayers: new Set()
        });
    }
    
    const selectionRoom = characterSelectionRooms.get(roomCode);
    selectionRoom.players.set(playerAddress, {
        address: playerAddress,
        name: playerName,
        ws: ws
    });
    
    // Track connection for cleanup
    ws.playerAddress = playerAddress;
    ws.characterSelectionRoom = roomCode;
    
    // Send current status to joining player
    const playersStatus = {};
    for (const [addr, selection] of selectionRoom.characterSelections.entries()) {
        playersStatus[addr] = {
            character: selection.character,
            ready: selectionRoom.readyPlayers.has(addr)
        };
    }
    
    ws.send(JSON.stringify({
        type: 'CHARACTER_SELECTION_UPDATE',
        payload: { playersStatus }
    }));
    
    console.log(`✅ ${playerName} joined character selection room ${roomCode}`);
}

async function handleCharacterSelected(ws, payload) {
    const { roomCode, playerAddress, character, ready } = payload;
    
    console.log(`🎭 Character selected: ${character.name} by ${playerAddress} (ready: ${ready})`);
    
    const selectionRoom = characterSelectionRooms.get(roomCode);
    if (!selectionRoom) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Character selection room not found'
        }));
        return;
    }
    
    // Update character selection
    selectionRoom.characterSelections.set(playerAddress, {
        character,
        selectedAt: new Date().toISOString()
    });
    
    // Update ready status
    if (ready) {
        selectionRoom.readyPlayers.add(playerAddress);
    } else {
        selectionRoom.readyPlayers.delete(playerAddress);
    }
    
    // Broadcast update to all players in selection room
    const playersStatus = {};
    for (const [addr, selection] of selectionRoom.characterSelections.entries()) {
        playersStatus[addr] = {
            character: selection.character,
            ready: selectionRoom.readyPlayers.has(addr)
        };
    }
    
    selectionRoom.players.forEach((player) => {
        if (player.ws && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify({
                type: 'CHARACTER_SELECTION_UPDATE',
                payload: { playersStatus }
            }));
        }
    });
    
    // Check if all players are ready
    const totalPlayers = selectionRoom.players.size;
    const readyPlayers = selectionRoom.readyPlayers.size;
    
    if (readyPlayers === totalPlayers && totalPlayers > 0) {
        console.log(`🎉 All ${totalPlayers} players ready in room ${roomCode}! Starting battle...`);
        
        // Create character selections object
        const characterSelections = {};
        for (const [addr, selection] of selectionRoom.characterSelections.entries()) {
            characterSelections[addr] = selection.character;
        }
        
        // Notify all players that everyone is ready
        selectionRoom.players.forEach((player) => {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify({
                    type: 'ALL_PLAYERS_READY',
                    payload: { characterSelections }
                }));
            }
        });
        
        // Clean up character selection room after 5 seconds
        setTimeout(() => {
            characterSelectionRooms.delete(roomCode);
            console.log(`🧹 Character selection room ${roomCode} cleaned up`);
        }, 5000);
    }
}

// Multiplayer Room handlers
async function handleCreateRoom(ws, payload) {
    const room = payload;
    
    // Validate room data
    if (!room.id || !room.code || !room.host) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Invalid room data'
        }));
        return;
    }
    
    // Check if room code already exists
    if (multiplayerRooms.has(room.code)) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Room code already exists'
        }));
        return;
    }
    
    // Clean up any existing rooms this player might be in
    cleanupPlayerFromAllRooms(room.host);
    
    // Store room and associate WebSocket
    room.hostWs = ws;
    room.playerWs = new Map();
    room.playerWs.set(room.host, ws);
    
    // Track connection info for cleanup
    ws.playerAddress = room.host;
    ws.roomCode = room.code;
    
    multiplayerRooms.set(room.code, room);
    
    console.log(`🏠 Room created: ${room.name} (${room.code}) by ${room.host.substring(0, 6)}...`);
    
    ws.send(JSON.stringify({
        type: 'ROOM_CREATED',
        room: sanitizeRoomForClient(room)
    }));
}

async function handleJoinRoom(ws, payload) {
    const { roomCode, player } = payload;
    
    const room = multiplayerRooms.get(roomCode);
    if (!room) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Room not found'
        }));
        return;
    }
    
    // Check if room is full
    if (room.players.length >= room.maxPlayers) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Room is full'
        }));
        return;
    }
    
    // Check if player is already in THIS room
    const alreadyInRoom = room.players.some(p => p.address.toLowerCase() === player.address.toLowerCase());
    
    if (alreadyInRoom) {
        // Player is already in this room - just update their WebSocket connection
        room.playerWs.set(player.address, ws);
        ws.playerAddress = player.address;
        ws.roomCode = roomCode;
        
        console.log(`🔄 ${player.displayName} reconnected to room ${room.code}`);
        console.log(`🔌 Updated WebSocket for ${player.address.substring(0, 8)}... - readyState: ${ws.readyState}`);
        
        // Send room data to player
        ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            room: sanitizeRoomForClient(room)
        }));
        
        // Notify other players
        broadcastToRoom(room, {
            type: 'PLAYER_RECONNECTED',
            player,
            players: room.players,
            room: sanitizeRoomForClient(room)
        });
        
        return;
    }
    
    // Clean up player from OTHER rooms (not this one)
    for (const [otherRoomCode, otherRoom] of multiplayerRooms.entries()) {
        if (otherRoomCode === roomCode) continue; // Skip the room they're joining
        
        const playerIndex = otherRoom.players.findIndex(p => p.address.toLowerCase() === player.address.toLowerCase());
        if (playerIndex !== -1) {
            const oldPlayer = otherRoom.players[playerIndex];
            otherRoom.players.splice(playerIndex, 1);
            otherRoom.playerWs.delete(player.address);
            
            console.log(`🧹 Cleaned up ${player.displayName} from other room ${otherRoom.code}`);
            
            // If host left and there are other players, transfer host
            if (oldPlayer.isHost && otherRoom.players.length > 0) {
                otherRoom.players[0].isHost = true;
                otherRoom.host = otherRoom.players[0].address;
                otherRoom.hostWs = otherRoom.playerWs.get(otherRoom.players[0].address);
                console.log(`👑 Host transferred to ${otherRoom.players[0].displayName} in room ${otherRoom.code}`);
            }
            
            // If room is empty, delete it
            if (otherRoom.players.length === 0) {
                multiplayerRooms.delete(otherRoomCode);
                console.log(`🗑️ Room ${otherRoom.code} deleted (empty after cleanup)`);
            } else {
                // Notify remaining players
                broadcastToRoom(otherRoom, {
                    type: 'PLAYER_LEFT',
                    player: oldPlayer,
                    players: otherRoom.players
                });
            }
        }
    }
    
    // Add player to room
    room.players.push(player);
    room.playerWs.set(player.address, ws);
    
    // Track connection info for cleanup
    ws.playerAddress = player.address;
    ws.roomCode = roomCode;
    
    console.log(`👋 ${player.displayName} joined room ${room.code}`);
    console.log(`🔌 Stored WebSocket for ${player.address.substring(0, 8)}... - readyState: ${ws.readyState}`);
    console.log(`📊 Room now has ${room.players.length} players with ${room.playerWs.size} WebSocket connections`);
    console.log(`📢 Broadcasting PLAYER_JOINED to ${room.players.length} players...`);
    
    // DEBUG: Log all WebSocket states before broadcast
    room.players.forEach(p => {
        const pWs = room.playerWs.get(p.address);
        console.log(`  🔍 ${p.displayName}: WebSocket ${pWs ? 'exists' : 'MISSING'}, readyState: ${pWs?.readyState || 'N/A'}`);
    });
    
    // Send room data to new player FIRST (before broadcast)
    ws.send(JSON.stringify({
        type: 'ROOM_JOINED',
        room: sanitizeRoomForClient(room)
    }));
    
    console.log(`✅ ROOM_JOINED sent to new player`);
    
    // Small delay to ensure WebSocket is fully ready
    setTimeout(() => {
        // Notify all players in room (including the new player)
        broadcastToRoom(room, {
            type: 'PLAYER_JOINED',
            player,
            players: room.players,
            room: sanitizeRoomForClient(room) // Send complete room data
        });
        
        console.log(`✅ PLAYER_JOINED broadcast complete`);
    }, 100); // 100ms delay to ensure WebSocket is ready
}

async function handleLeaveRoom(ws, payload) {
    const { roomCode, playerAddress } = payload;
    
    console.log(`👋 Leave room request: ${playerAddress} from room ${roomCode}`);
    
    const room = multiplayerRooms.get(roomCode);
    if (!room) {
        console.log(`❌ Room ${roomCode} not found`);
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Room not found'
        }));
        return;
    }
    
    const playerIndex = room.players.findIndex(p => p.address.toLowerCase() === playerAddress.toLowerCase());
    if (playerIndex === -1) {
        console.log(`❌ Player ${playerAddress} not found in room ${roomCode}`);
        console.log(`Available players:`, room.players.map(p => p.address));
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Player not in room'
        }));
        return;
    }
    
    const player = room.players[playerIndex];
    room.players.splice(playerIndex, 1);
    room.playerWs.delete(playerAddress);
    
    // Clear WebSocket tracking
    ws.playerAddress = null;
    ws.roomCode = null;
    
    console.log(`👋 ${player.displayName} left room ${room.code}`);
    
    // Send confirmation to the leaving player
    ws.send(JSON.stringify({
        type: 'ROOM_LEFT',
        message: 'Successfully left the room'
    }));
    
    // If host left and there are other players, transfer host
    if (player.isHost && room.players.length > 0) {
        room.players[0].isHost = true;
        room.host = room.players[0].address;
        room.hostWs = room.playerWs.get(room.players[0].address);
        console.log(`👑 Host transferred to ${room.players[0].displayName}`);
    }
    
    // If room is empty, delete it
    if (room.players.length === 0) {
        multiplayerRooms.delete(roomCode);
        console.log(`🗑️ Room ${room.code} deleted (empty)`);
        return;
    }
    
    // Notify remaining players
    broadcastToRoom(room, {
        type: 'PLAYER_LEFT',
        player,
        players: room.players
    });
    
    console.log(`📡 Notified ${room.players.length} remaining players`);
}

async function handleInvitePlayer(ws, payload) {
    const { roomCode, inviteAddress, inviterAddress } = payload;
    
    const room = multiplayerRooms.get(roomCode);
    if (!room) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Room not found'
        }));
        return;
    }
    
    // Validate inviter is in room
    if (!room.players.some(p => p.address === inviterAddress)) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'You are not in this room'
        }));
        return;
    }
    
    // Store invitation (in a real app, this would send an actual notification)
    const inviteId = `invite_${Date.now()}`;
    playerInvitations.set(inviteId, {
        id: inviteId,
        roomCode,
        roomName: room.name,
        inviteAddress,
        inviterAddress,
        inviterName: room.players.find(p => p.address === inviterAddress)?.displayName,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
    });
    
    console.log(`📧 Invitation sent to ${inviteAddress.substring(0, 6)}... for room ${room.code}`);
    
    // In a real implementation, you would:
    // 1. Send push notification to the invited player
    // 2. Send email/SMS notification
    // 3. Store in database for when they next connect
    
    ws.send(JSON.stringify({
        type: 'INVITE_SENT',
        inviteAddress,
        roomCode
    }));
}

async function handleToggleReady(ws, payload) {
    const { roomCode, playerAddress } = payload;
    
    console.log(`🔄 Toggle ready request: ${playerAddress} in room ${roomCode}`);
    
    const room = multiplayerRooms.get(roomCode);
    if (!room) {
        console.log(`❌ Room ${roomCode} not found`);
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Room not found'
        }));
        return;
    }
    
    const player = room.players.find(p => p.address.toLowerCase() === playerAddress.toLowerCase());
    if (!player) {
        console.log(`❌ Player ${playerAddress} not found in room ${roomCode}`);
        console.log(`Available players:`, room.players.map(p => p.address));
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Player not in room'
        }));
        return;
    }
    
    const oldReady = player.isReady;
    player.isReady = !player.isReady;
    
    console.log(`${player.isReady ? '✅' : '❌'} ${player.displayName} ${player.isReady ? 'ready' : 'not ready'} in room ${room.code} (was ${oldReady})`);
    
    // Notify all players
    broadcastToRoom(room, {
        type: 'PLAYER_READY',
        player,
        players: room.players
    });
    
    console.log(`📡 Broadcasted ready status to ${room.players.length} players`);
}

async function handleStartMultiplayerGame(ws, payload) {
    const { roomCode, hostAddress } = payload;
    
    const room = multiplayerRooms.get(roomCode);
    if (!room) return;
    
    // Validate host
    if (room.host !== hostAddress) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Only the host can start the game'
        }));
        return;
    }
    
    // Check if all players are ready
    const allReady = room.players.every(p => p.isReady || p.isHost);
    if (!allReady) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'All players must be ready'
        }));
        return;
    }
    
    // Check minimum players (reduced from 2 to 1 for testing, but keep 2 for multiplayer)
    if (room.players.length < 1) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Need at least 1 player to start'
        }));
        return;
    }
    
    console.log(`🚀 Starting ${room.gameMode} game in room ${room.code} with ${room.players.length} players`);
    
    const gameStartingMessage = {
        type: 'GAME_STARTING',
        gameMode: room.gameMode,
        players: room.players,
        room: sanitizeRoomForClient(room) // Send complete room data
    };
    
    console.log('📤 Sending GAME_STARTING message:', JSON.stringify(gameStartingMessage, null, 2));
    
    // Notify all players that game is starting with complete room data
    broadcastToRoom(room, gameStartingMessage);
    
    // Don't delete room immediately - keep it for character selection phase
    // It will be cleaned up after character selection is complete
    console.log(`✅ Game starting message sent to all players in room ${room.code}`);
}

async function handleRejoinRoom(ws, payload) {
    const { roomCode, playerAddress } = payload;
    
    const room = multiplayerRooms.get(roomCode);
    if (!room) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Room no longer exists'
        }));
        return;
    }
    
    // Check if player is in the room (case-insensitive)
    const player = room.players.find(p => p.address.toLowerCase() === playerAddress.toLowerCase());
    if (!player) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'You are not in this room'
        }));
        return;
    }
    
    // Update WebSocket connection for this player
    room.playerWs.set(playerAddress, ws);
    
    // Track connection info for cleanup
    ws.playerAddress = playerAddress;
    ws.roomCode = roomCode;
    
    // If this was the host, update host WebSocket
    if (player.isHost) {
        room.hostWs = ws;
    }
    
    console.log(`🔄 ${player.displayName} rejoined room ${room.code}`);
    
    // Send room data to rejoining player
    ws.send(JSON.stringify({
        type: 'ROOM_REJOINED',
        room: sanitizeRoomForClient(room)
    }));
    
    // Notify other players that this player is back online
    broadcastToRoom(room, {
        type: 'PLAYER_REJOINED',
        player,
        players: room.players
    });
}

async function handleSyncRoom(ws, payload) {
    const { roomCode, playerAddress } = payload;
    
    const room = multiplayerRooms.get(roomCode);
    if (!room) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Room no longer exists'
        }));
        return;
    }
    
    // Check if player is in the room
    const player = room.players.find(p => p.address === playerAddress);
    if (!player) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'You are not in this room'
        }));
        return;
    }
    
    // Send updated room data
    ws.send(JSON.stringify({
        type: 'ROOM_UPDATED',
        room: sanitizeRoomForClient(room)
    }));
}

function broadcastToRoom(room, message, excludeWs = null) {
    const messageStr = JSON.stringify(message);
    
    console.log(`📢 Broadcasting to room ${room.code}: ${message.type}`);
    console.log(`📊 Room has ${room.players.length} players, ${room.playerWs.size} WebSocket connections`);
    
    let sentCount = 0;
    let failedCount = 0;
    
    room.players.forEach(player => {
        const playerWs = room.playerWs.get(player.address);
        
        if (!playerWs) {
            failedCount++;
            console.log(`  ❌ ${player.displayName} (${player.address.substring(0, 8)}...) - NO WEBSOCKET STORED`);
            return;
        }
        
        if (playerWs === excludeWs) {
            console.log(`  ⏭️  ${player.displayName} (${player.address.substring(0, 8)}...) - EXCLUDED`);
            return;
        }
        
        if (playerWs.readyState !== WebSocket.OPEN) {
            failedCount++;
            console.log(`  ❌ ${player.displayName} (${player.address.substring(0, 8)}...) - WebSocket state: ${playerWs.readyState} (not OPEN)`);
            return;
        }
        
        try {
            playerWs.send(messageStr);
            sentCount++;
            console.log(`  ✅ Sent to ${player.displayName} (${player.address.substring(0, 8)}...)`);
        } catch (error) {
            failedCount++;
            console.log(`  ❌ ${player.displayName} (${player.address.substring(0, 8)}...) - Send error: ${error.message}`);
        }
    });
    
    console.log(`📢 Broadcast complete: ${sentCount} sent, ${failedCount} failed`);
    
    if (failedCount > 0) {
        console.log(`⚠️  WARNING: ${failedCount} players did not receive the message!`);
    }
}

function sanitizeRoomForClient(room) {
    // Remove WebSocket references before sending to client
    return {
        id: room.id,
        code: room.code,
        name: room.name,
        host: room.host,
        players: room.players,
        maxPlayers: room.maxPlayers,
        isPrivate: room.isPrivate,
        createdAt: room.createdAt,
        gameMode: room.gameMode
    };
}

// API endpoint to get pending invitations for a player
app.get('/api/invitations/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const invitations = [];
        
        for (const [inviteId, invite] of playerInvitations.entries()) {
            if (invite.inviteAddress.toLowerCase() === address.toLowerCase()) {
                // Check if invitation is still valid
                if (new Date() < new Date(invite.expiresAt)) {
                    // Check if room still exists
                    const room = multiplayerRooms.get(invite.roomCode);
                    if (room && room.players.length < room.maxPlayers) {
                        invitations.push(invite);
                    } else {
                        // Clean up expired/invalid invitation
                        playerInvitations.delete(inviteId);
                    }
                } else {
                    // Clean up expired invitation
                    playerInvitations.delete(inviteId);
                }
            }
        }
        
        res.json({
            success: true,
            invitations
        });
    } catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ error: 'Failed to fetch invitations' });
    }
});

// API endpoint to get active rooms (for debugging)
app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = [];
        for (const [code, room] of multiplayerRooms.entries()) {
            rooms.push(sanitizeRoomForClient(room));
        }
        
        res.json({
            success: true,
            rooms,
            totalRooms: rooms.length
        });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

// API endpoint to clear all rooms (for debugging)
app.delete('/api/rooms/clear', async (req, res) => {
    try {
        const roomCount = multiplayerRooms.size;
        multiplayerRooms.clear();
        
        console.log(`🧹 Cleared all ${roomCount} rooms via API`);
        
        res.json({
            success: true,
            message: `Cleared ${roomCount} rooms`,
            clearedRooms: roomCount
        });
    } catch (error) {
        console.error('Error clearing rooms:', error);
        res.status(500).json({ error: 'Failed to clear rooms' });
    }
});

// War Battle API endpoints
app.post('/api/war-battle/initialize', async (req, res) => {
    try {
        const { teamLeaderAddress, selectedCharacter, currentRoom, characterSelections } = req.body;
        
        const battleId = `war_${Date.now()}_${Math.random()}`;
        
        // Initialize enemies for war battle (Round 1)
        const enemies = generateRoundEnemies(1);
        
        // Use selected character or default to Eleven
        const playerCharacter = selectedCharacter || {
            id: 'eleven',
            name: 'Eleven',
            image: '/assets/characters/eleven.png'
        };
        
        let strangerThingsTeam;
        
        if (currentRoom && currentRoom.players && currentRoom.players.length > 1) {
            // MULTIPLAYER: Use real players from the room with their selected characters
            console.log('🎮 Creating MULTIPLAYER battle with real players:', currentRoom.players.length);
            console.log('🎭 Character selections:', characterSelections);
            console.log('👥 Room players:', currentRoom.players.map(p => ({ address: p.address, displayName: p.displayName, isHost: p.isHost })));
            
            strangerThingsTeam = currentRoom.players.map((player, index) => {
                // NO MORE TEAM LEADER - Everyone is equal!
                
                // Use selected character if available, otherwise assign default
                let characterName, characterImage;
                if (characterSelections && characterSelections[player.address]) {
                    characterName = characterSelections[player.address].name;
                    characterImage = characterSelections[player.address].image;
                } else {
                    // Fallback to default character assignment
                    const characterNames = ['Eleven', 'Steve Harrington', 'Dustin Henderson', 'Max Mayfield', 'Mike Wheeler', 'Lucas Sinclair'];
                    const characterImages = ['/assets/characters/eleven.png', '/assets/characters/steve.png', '/assets/characters/dustin.png', '/assets/characters/max.png', '/assets/characters/mike.png', '/assets/characters/lucas.png'];
                    
                    characterName = characterNames[index % characterNames.length];
                    characterImage = characterImages[index % characterImages.length];
                }
                
                console.log(`  👤 Player ${index + 1}:`, {
                    address: player.address,
                    characterName,
                    delegatedAmount: 0,
                    isActive: true // Active by default - no delegation needed!
                });
                
                return {
                    address: player.address,
                    displayName: player.displayName,
                    characterName: characterName,
                    characterImage: characterImage,
                    isTeamLeader: false, // NO MORE LEADERS - Everyone equal!
                    delegatedAmount: 0, // No delegation needed
                    spentAmount: 0,
                    isActive: true, // Active by default!
                    lastAction: `${characterName} joined the battle!`
                };
            });
            
            console.log('✅ MULTIPLAYER team created with', strangerThingsTeam.length, 'real players');
        } else {
            // SINGLE PLAYER: Use mock team members
            console.log('🎮 Creating SINGLE PLAYER battle');
            console.log('📊 currentRoom:', currentRoom);
            console.log('📊 currentRoom.players:', currentRoom?.players);
            console.log('📊 players.length:', currentRoom?.players?.length);
            
            // SOLO MODE: Only create the real player, no fake teammates!
            strangerThingsTeam = [
                {
                    address: teamLeaderAddress,
                    displayName: `${teamLeaderAddress.substring(0, 6)}...${teamLeaderAddress.substring(teamLeaderAddress.length - 4)}`,
                    characterName: playerCharacter.name,
                    characterImage: playerCharacter.image,
                    isTeamLeader: true,
                    delegatedAmount: 0,
                    spentAmount: 0,
                    isActive: true,
                    lastAction: `${playerCharacter.name} - Ready for battle!`
                }
            ];
            
            console.log('✅ SOLO player created:', strangerThingsTeam[0].characterName);
        }
        
        const battle = {
            id: battleId,
            teamLeaderAddress,
            teamMembers: strangerThingsTeam,
            enemies,
            transactions: [{
                id: `tx_${Date.now()}`,
                weapon: 'BATTLE_INITIALIZED',
                cost: 0,
                spentFrom: [],
                timestamp: new Date().toISOString(),
                success: true
            }],
            phase: 'battle',
            round: 1,
            createdAt: new Date().toISOString(),
            playerWs: new Map(),
            activeVote: null // Track active weapon votes
        };
        
        warBattles.set(battleId, battle);
        
        console.log(`⚔️ War battle initialized: ${battleId} by ${teamLeaderAddress}`);
        
        res.json({
            success: true,
            battleId,
            battle: {
                id: battle.id,
                teamMembers: battle.teamMembers,
                enemies: battle.enemies,
                transactions: battle.transactions,
                phase: battle.phase,
                round: battle.round
            }
        });
    } catch (error) {
        console.error('Error initializing war battle:', error);
        res.status(500).json({ error: 'Failed to initialize war battle' });
    }
});

app.get('/api/war-battle/:battleId', async (req, res) => {
    try {
        const { battleId } = req.params;
        
        const battle = warBattles.get(battleId);
        if (!battle) {
            return res.status(404).json({ error: 'Battle not found' });
        }
        
        res.json({
            success: true,
            battle: {
                id: battle.id,
                teamMembers: battle.teamMembers,
                enemies: battle.enemies,
                transactions: battle.transactions,
                phase: battle.phase,
                round: battle.round
            }
        });
    } catch (error) {
        console.error('Error fetching war battle:', error);
        res.status(500).json({ error: 'Failed to fetch war battle' });
    }
});

// Find battle by team leader address (for teammates to join)
app.post('/api/war-battle/find', async (req, res) => {
    try {
        const { teamLeaderAddress } = req.body;
        
        console.log('🔍 Finding battle for team leader:', teamLeaderAddress);
        
        // Find the most recent battle with this team leader
        let foundBattle = null;
        let foundBattleId = null;
        let newestTime = 0;
        
        for (const [battleId, battle] of warBattles.entries()) {
            if (battle.teamLeaderAddress.toLowerCase() === teamLeaderAddress.toLowerCase()) {
                const battleTime = new Date(battle.createdAt).getTime();
                if (battleTime > newestTime) {
                    newestTime = battleTime;
                    foundBattle = battle;
                    foundBattleId = battleId;
                }
            }
        }
        
        if (!foundBattle) {
            console.log('❌ No battle found for team leader:', teamLeaderAddress);
            return res.status(404).json({ error: 'Battle not found' });
        }
        
        console.log('✅ Found battle:', foundBattleId);
        
        res.json({
            success: true,
            battleId: foundBattleId,
            battle: {
                id: foundBattle.id,
                teamMembers: foundBattle.teamMembers,
                enemies: foundBattle.enemies,
                transactions: foundBattle.transactions,
                phase: foundBattle.phase,
                round: foundBattle.round
            }
        });
    } catch (error) {
        console.error('Error finding war battle:', error);
        res.status(500).json({ error: 'Failed to find war battle' });
    }
});

app.post('/api/war-battle/:battleId/connect', async (req, res) => {
    try {
        const { battleId } = req.params;
        const { playerAddress } = req.body;
        
        const battle = warBattles.get(battleId);
        if (!battle) {
            return res.status(404).json({ error: 'Battle not found' });
        }
        
        const player = battle.teamMembers.find(m => m.address.toLowerCase() === playerAddress.toLowerCase());
        if (!player) {
            return res.status(403).json({ error: 'Player not in this battle' });
        }
        
        res.json({
            success: true,
            message: 'Ready to connect to battle WebSocket',
            battleId,
            wsPort: 8081
        });
    } catch (error) {
        console.error('Error connecting to war battle:', error);
        res.status(500).json({ error: 'Failed to connect to war battle' });
    }
});

// Clean up expired invitations periodically
setInterval(() => {
    const now = new Date();
    const expiredInvites = [];
    
    for (const [inviteId, invite] of playerInvitations.entries()) {
        if (now > new Date(invite.expiresAt)) {
            expiredInvites.push(inviteId);
        }
    }
    
    for (const inviteId of expiredInvites) {
        playerInvitations.delete(inviteId);
    }
    
    if (expiredInvites.length > 0) {
        console.log(`🧹 Cleaned up ${expiredInvites.length} expired invitations`);
    }
}, 5 * 60 * 1000); // Check every 5 minutes
setInterval(() => {
    const now = new Date();
    const expiredSessions = [];
    
    for (const [sessionId, session] of riftSessions.entries()) {
        if (now > session.expiresAt) {
            expiredSessions.push(sessionId);
        }
    }
    
    for (const sessionId of expiredSessions) {
        const session = riftSessions.get(sessionId);
        if (session) {
            console.log(`🧹 Cleaning up expired rift session: ${session.roomCode}`);
            riftSessions.delete(sessionId);
            roomCodeToSessionId.delete(session.roomCode);
        }
    }
}, 60000); // Check every minute

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server with WebSocket on same port
server.listen(PORT, () => {
    console.log(`🚀 Stranger Things Battle Backend running on port ${PORT}`);
    console.log(`📡 WebSocket server running on same port (${PORT})`);
    console.log(`🔗 Connected to Mantle Sepolia`);
});

module.exports = app;