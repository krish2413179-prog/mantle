# Requirements Document

## Introduction

The Psychic Link system enables two players to establish a supernatural connection that allows mutual authorization for spending consumables during cooperative gameplay sessions. This feature builds upon the existing EIP-7702 Ghost-Pay delegation system to create a shared resource pool between trusted partners.

## Glossary

- **Anchor**: The player who creates a rift and generates the room code
- **Drifter**: The player who joins using the room code
- **Psychic_Link**: A bidirectional authorization allowing both players to spend each other's consumables
- **Rift_Code**: A unique identifier for the multiplayer session (format: RIFT-XXX)
- **Game_Agent**: The AI-controlled wallet that executes transactions on behalf of linked players
- **Consumables**: In-game items that can be spent (power-ups, energy, special abilities)
- **Link_Status**: The current state of the psychic connection (inactive, pending, active)

## Requirements

### Requirement 1: Room Creation and Joining

**User Story:** As an Anchor, I want to create a rift and share a room code, so that a Drifter can join my session for cooperative gameplay.

#### Acceptance Criteria

1. WHEN an Anchor clicks "CREATE RIFT", THE System SHALL generate a unique room code in format "RIFT-XXX"
2. THE System SHALL display the room code prominently for sharing
3. WHEN a Drifter enters a valid room code, THE System SHALL connect them to the Anchor's session
4. WHEN a Drifter enters an invalid room code, THE System SHALL display an error message
5. THE System SHALL support only two players per rift session

### Requirement 2: Psychic Link Initialization

**User Story:** As a player in a rift session, I want to establish a psychic link with my partner, so that we can share consumable spending authority.

#### Acceptance Criteria

1. WHEN both players are connected to a rift, THE System SHALL display "INITIALIZE PSYCHIC LINK?" message on both screens
2. WHEN both players click "LINK SOULS", THE System SHALL initiate the EIP-7702 authorization process
3. THE System SHALL present a single MetaMask signature request to each player
4. WHEN both players sign the authorization, THE System SHALL establish the psychic link
5. IF either player cancels the signature, THE System SHALL abort the link process

### Requirement 3: EIP-7702 Mutual Authorization

**User Story:** As a player, I want to authorize my partner to spend my consumables through the Game Agent, so that we can cooperatively use resources during gameplay.

#### Acceptance Criteria

1. THE System SHALL create bidirectional EIP-7702 delegations for both players
2. THE authorization message SHALL specify consumable spending permissions only
3. THE System SHALL use the existing Game Agent wallet for transaction execution
4. WHEN authorization is complete, THE System SHALL store the mutual delegation signatures
5. THE delegations SHALL remain active only for the current rift session

### Requirement 4: Link Status Visualization

**User Story:** As a player, I want to see the status of our psychic link, so that I know when cooperative features are available.

#### Acceptance Criteria

1. THE System SHALL display a "Link" icon in the game interface
2. WHEN the psychic link is inactive, THE Link_Icon SHALL appear gray
3. WHEN the psychic link is pending, THE Link_Icon SHALL pulse orange
4. WHEN the psychic link is active, THE Link_Icon SHALL glow neon green
5. THE System SHALL show both players' wallet addresses when linked

### Requirement 5: Cooperative Consumable Usage

**User Story:** As a linked player, I want to use my partner's consumables during gameplay, so that we can coordinate our strategy more effectively.

#### Acceptance Criteria

1. WHEN the psychic link is active, THE System SHALL allow either player to spend both players' consumables
2. THE System SHALL execute consumable transactions through the Game Agent instantly
3. THE System SHALL display real-time updates of both players' consumable inventories
4. WHEN a player uses their partner's consumables, THE System SHALL log the action in battle logs
5. THE System SHALL prevent overdraft of consumables (cannot spend more than available)

### Requirement 6: Session Management

**User Story:** As a player, I want the psychic link to be session-specific, so that my authorization doesn't persist beyond our current game.

#### Acceptance Criteria

1. WHEN either player leaves the rift session, THE System SHALL terminate the psychic link
2. WHEN the game session ends, THE System SHALL revoke all mutual delegations
3. THE System SHALL clear stored delegation signatures upon session termination
4. WHEN starting a new rift session, THE System SHALL require fresh authorization
5. THE System SHALL support reconnection to the same rift with existing authorization

### Requirement 7: Security and Trust

**User Story:** As a player, I want assurance that my partner can only spend consumables and not access my other assets, so that I feel safe establishing the psychic link.

#### Acceptance Criteria

1. THE authorization SHALL be limited to game consumables only
2. THE System SHALL NOT allow access to NFTs, tokens, or other wallet assets
3. THE System SHALL display clear warnings about what is being authorized
4. THE System SHALL provide an emergency "BREAK LINK" button to revoke authorization
5. WHEN the link is broken, THE System SHALL immediately revoke all delegations

### Requirement 8: Error Handling and Recovery

**User Story:** As a player, I want the system to handle connection issues gracefully, so that temporary problems don't break our psychic link.

#### Acceptance Criteria

1. WHEN network connectivity is lost, THE System SHALL attempt to reconnect automatically
2. WHEN reconnection succeeds, THE System SHALL restore the psychic link status
3. WHEN MetaMask signature fails, THE System SHALL allow retry without restarting the process
4. WHEN one player's wallet becomes unavailable, THE System SHALL notify the other player
5. THE System SHALL provide clear error messages for all failure scenarios