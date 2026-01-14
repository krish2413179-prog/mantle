# Implementation Plan: Psychic Link System

## Overview

This implementation plan transforms the Psychic Link design into a series of incremental coding tasks that build upon the existing Stranger Things Battle DApp. Each task focuses on specific components while ensuring seamless integration with the current Ghost-Pay infrastructure.

## Tasks

- [-] 1. Setup core multiplayer infrastructure
  - Create WebSocket event system for real-time communication
  - Implement room code generation and validation utilities
  - Setup session state management with proper cleanup
  - _Requirements: 1.1, 1.4_

- [-] 1.1 Write property test for room code generation
  - **Property 1: Room Code Uniqueness and Format**
  - **Validates: Requirements 1.1**

- [ ] 1.2 Write property test for room code validation
  - **Property 3: Invalid Room Code Rejection**
  - **Validates: Requirements 1.4**

- [ ] 2. Implement rift session management
  - [ ] 2.1 Create RiftSessionManager class with session lifecycle
    - Implement createRift() method for anchor players
    - Implement joinRift() method for drifter players
    - Add session capacity limits (two players maximum)
    - _Requirements: 1.1, 1.3, 1.5_

  - [ ] 2.2 Write property tests for session management
    - **Property 2: Valid Room Code Connection**
    - **Property 4: Two-Player Session Limit**
    - **Validates: Requirements 1.3, 1.5**

  - [ ] 2.3 Integrate session manager with existing game state
    - Extend StrangerThingsState to support multiplayer sessions
    - Add rift creation and joining UI components
    - _Requirements: 1.1, 1.3_

- [ ] 3. Build psychic link authorization system
  - [ ] 3.1 Create PsychicLinkManager for EIP-7702 handling
    - Implement mutual delegation creation logic
    - Create consumable-only authorization message structure
    - Add signature collection and validation
    - _Requirements: 2.2, 3.1, 3.2_

  - [ ] 3.2 Write property tests for authorization system
    - **Property 5: Mutual Authorization Initiation**
    - **Property 9: Bidirectional Delegation Creation**
    - **Property 10: Consumable-Only Authorization Scope**
    - **Validates: Requirements 2.2, 3.1, 3.2**

  - [ ] 3.3 Integrate with MetaMask service
    - Extend MetaMaskService to support psychic link signatures
    - Add signature request handling for both players
    - Implement authorization cancellation logic
    - _Requirements: 2.3, 2.4, 2.5_

- [ ] 3.4 Write property tests for MetaMask integration
  - **Property 6: Single Signature Request Per Player**
  - **Property 7: Link Establishment on Dual Signatures**
  - **Property 8: Authorization Cancellation Handling**
  - **Validates: Requirements 2.3, 2.4, 2.5**

- [ ] 4. Checkpoint - Ensure session and authorization systems work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement consumable synchronization engine
  - [ ] 5.1 Create ConsumableSyncEngine for inventory management
    - Implement shared inventory data structures
    - Add real-time inventory synchronization via WebSocket
    - Create consumable spending validation logic
    - _Requirements: 5.1, 5.5_

  - [ ] 5.2 Write property tests for consumable sync
    - **Property 14: Mutual Consumable Spending Access**
    - **Property 16: Consumable Overdraft Prevention**
    - **Validates: Requirements 5.1, 5.5**

  - [ ] 5.3 Integrate with Game Agent transaction system
    - Extend blockchain service to handle partner consumable spending
    - Add transaction logging for partner resource usage
    - Implement instant execution through existing Ghost-Pay system
    - _Requirements: 5.2, 5.4_

- [ ] 5.4 Write property tests for transaction system
  - **Property 11: Game Agent Transaction Execution**
  - **Property 15: Partner Consumable Usage Logging**
  - **Validates: Requirements 5.2, 5.4**

- [ ] 6. Build psychic link UI components
  - [ ] 6.1 Create rift creation and joining interface
    - Add "CREATE RIFT" button and room code display
    - Implement room code input and validation UI
    - Add connection status indicators
    - _Requirements: 1.1, 1.3_

  - [ ] 6.2 Implement psychic link status visualization
    - Create animated Link icon with status colors (gray/orange/green)
    - Add "INITIALIZE PSYCHIC LINK?" prompt system
    - Implement "LINK SOULS" confirmation buttons
    - Add emergency "BREAK LINK" functionality
    - _Requirements: 2.1, 4.1-4.4, 7.4_

  - [ ] 6.3 Add shared consumable inventory display
    - Show both players' consumable inventories in real-time
    - Add visual indicators for partner resource usage
    - Implement consumable selection for cross-player spending
    - _Requirements: 4.5, 5.3_

- [ ] 7. Implement session lifecycle management
  - [ ] 7.1 Add session termination and cleanup logic
    - Implement automatic delegation revocation on session end
    - Add player disconnect handling with link termination
    - Create signature cleanup and storage management
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 7.2 Write property tests for session lifecycle
    - **Property 13: Session-Scoped Delegation Lifecycle**
    - **Property 17: Session Termination Link Cleanup**
    - **Property 20: Emergency Link Revocation**
    - **Validates: Requirements 6.1, 6.2, 6.3, 7.5**

  - [ ] 7.3 Implement session persistence and reconnection
    - Add session state persistence for reconnection scenarios
    - Implement authorization restoration on reconnect
    - Add fresh authorization requirements for new sessions
    - _Requirements: 6.4, 6.5_

- [ ] 7.4 Write property tests for reconnection system
  - **Property 18: Fresh Authorization Requirement**
  - **Property 19: Reconnection State Preservation**
  - **Validates: Requirements 6.4, 6.5**

- [ ] 8. Add error handling and recovery systems
  - [ ] 8.1 Implement network error recovery
    - Add automatic reconnection on connectivity loss
    - Implement link state restoration after reconnection
    - Add retry logic for failed MetaMask signatures
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 8.2 Write property tests for error recovery
    - **Property 21: Automatic Reconnection on Network Loss**
    - **Property 22: Link State Restoration on Reconnection**
    - **Property 23: Signature Failure Retry Capability**
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [ ] 8.3 Add wallet availability monitoring
    - Implement partner wallet status monitoring
    - Add notification system for wallet unavailability
    - Create comprehensive error messaging system
    - _Requirements: 8.4, 8.5_

- [ ] 8.4 Write property tests for wallet monitoring
  - **Property 24: Wallet Unavailability Notification**
  - **Validates: Requirements 8.4**

- [ ] 9. Integration and testing
  - [ ] 9.1 Integrate psychic link system with existing battle mechanics
    - Connect shared consumables to existing power-up system
    - Add psychic link status to battle UI
    - Ensure compatibility with existing Ghost-Pay features
    - _Requirements: 5.1, 5.2_

  - [ ] 9.2 Write integration tests for battle system
    - Test end-to-end rift session with consumable sharing
    - Test psychic link during active battle scenarios
    - Test session termination during gameplay
    - _Requirements: 5.1, 5.2, 6.1_

  - [ ] 9.3 Add comprehensive error handling and user feedback
    - Implement user-friendly error messages for all failure scenarios
    - Add loading states and progress indicators
    - Create help system for psychic link setup
    - _Requirements: 8.5_

- [ ] 10. Final checkpoint - Ensure complete system works
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation of complex multiplayer features
- Property tests validate universal correctness properties across all scenarios
- Integration tests ensure seamless compatibility with existing game systems
- The implementation builds incrementally on the existing Ghost-Pay infrastructure