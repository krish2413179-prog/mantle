'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { GameLobby } from '@/components/game/GameLobby'
import { BattleArena } from '@/components/game/BattleArena'
import { CharacterSelection } from '@/components/game/CharacterSelection'
import { MultiplayerCharacterSelection } from '@/components/multiplayer/MultiplayerCharacterSelection'
import { GhostPaySetup } from '@/components/ghost-pay/GhostPaySetup'
import { RoomLobby } from '@/components/multiplayer/RoomLobby'
import { ImprovedWarBattle } from '@/components/war/ImprovedWarBattle'
import { InvitationNotifications } from '@/components/multiplayer/InvitationNotifications'
import { useState, useEffect } from 'react'
import { getWMANTLEBalance } from '@/lib/warBattleContract'

interface Character {
  id: string
  name: string
  image: string
  description: string
  specialAbility: string
  stats: {
    psychic: number
    combat: number
    tech: number
    leadership: number
  }
  isLeader?: boolean
}

export default function Home() {
  const { address, isConnected } = useAccount()
  const [gamePhase, setGamePhase] = useState<'menu' | 'lobby' | 'multiplayer' | 'character-selection' | 'multiplayer-character-selection' | 'battle' | 'ghost-setup'>('menu')
  const [isGhostPayActive, setIsGhostPayActive] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [currentRoom, setCurrentRoom] = useState<any>(null) // Store room data for multiplayer battles
  const [characterSelections, setCharacterSelections] = useState<Record<string, Character>>({}) // Store all player character selections
  const [wmantleBalance, setWmantleBalance] = useState<string>('0')

  // Check Ghost-Pay status when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      checkGhostPayStatus(address)
      loadWMANTLEBalance()
    }
  }, [isConnected, address])

  // Auto-refresh WMANTLE balance every 5 seconds
  useEffect(() => {
    if (isConnected && address) {
      const interval = setInterval(loadWMANTLEBalance, 5000)
      return () => clearInterval(interval)
    }
  }, [isConnected, address])

  const loadWMANTLEBalance = async () => {
    if (!address) return
    try {
      const balance = await getWMANTLEBalance(address)
      setWmantleBalance(balance)
    } catch (error) {
      console.error('Failed to load WMANTLE balance:', error)
    }
  }

  const checkGhostPayStatus = async (walletAddress: string) => {
    try {
      // Check if Ghost-Pay delegation is active
      const stored = localStorage.getItem(`ghostpay_delegation_${walletAddress.toLowerCase()}`)
      
      if (stored) {
        const data = JSON.parse(stored)
        const now = Date.now()
        const age = now - data.timestamp
        
        // Consider delegation active if less than 24 hours old
        const isActive = age < (24 * 60 * 60 * 1000)
        setIsGhostPayActive(isActive)
        
        if (!isActive) {
          setGamePhase('ghost-setup')
        }
      } else {
        setGamePhase('ghost-setup')
      }
    } catch (error) {
      console.error('Error checking Ghost-Pay status:', error)
      setGamePhase('ghost-setup')
    }
  }

  const handleGhostPaySetupComplete = () => {
    setIsGhostPayActive(true)
    setGamePhase('menu')
  }

  const handleJoinRoomFromInvite = (roomCode: string) => {
    setGamePhase('multiplayer')
    // The RoomLobby component will handle the actual joining
  }

  const handleCharacterSelected = (character: Character) => {
    setSelectedCharacter(character)
    setGamePhase('battle')
  }

  const handleMultiplayerGameStart = (room: any) => {
    console.log('🎮 Multiplayer game starting with room:', room)
    console.log('🎮 Room players:', room?.players)
    console.log('🎮 Room code:', room?.code)
    
    if (!room || !room.players || !Array.isArray(room.players)) {
      console.error('❌ Invalid room data received:', room)
      alert('Invalid room data received. Please try again.')
      return
    }
    
    if (room.players.length === 0) {
      console.error('❌ No players in room:', room)
      alert('No players found in room. Please try again.')
      return
    }
    
    setCurrentRoom(room) // Store room data
    setGamePhase('multiplayer-character-selection') // Go to multiplayer character selection
  }

  const handleMultiplayerCharactersReady = (room: any, selections: Record<string, Character>) => {
    console.log('🎭 All players selected characters:', selections)
    setCurrentRoom(room)
    setCharacterSelections(selections)
    setSelectedCharacter(selections[address!]) // Set current player's character
    setGamePhase('battle')
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-red-950 to-purple-950 -z-10" />
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-10 -z-10" />
      
      {/* Floating particles */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-red-500/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative bg-black/80 backdrop-blur-md border-b-2 border-red-500/50 shadow-lg shadow-red-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-5xl animate-pulse">🔥</div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent animate-gradient">
                  STRANGER THINGS BATTLE
                </h1>
                <p className="text-xs text-gray-400">Powered by ERC-7715 & Mantle</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isConnected && (
                <div className="bg-purple-500/20 border-2 border-purple-500 rounded-full px-4 py-2 text-sm font-bold">
                  <span className="mr-2">💰</span>
                  {wmantleBalance} WMANTLE
                </div>
              )}
              {isGhostPayActive && (
                <div className="bg-green-500/20 border-2 border-green-500 rounded-full px-4 py-2 text-sm font-bold animate-pulse">
                  <span className="mr-2">👻</span>
                  GHOST-PAY ACTIVE
                </div>
              )}
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        {!isConnected ? (
          // Welcome Screen
          <div className="min-h-[80vh] flex items-center justify-center px-6">
            <div className="max-w-4xl w-full">
              <div className="text-center mb-12">
                <div className="text-9xl mb-6 animate-bounce">⚔️</div>
                <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                  Enter the Upside Down
                </h2>
                <p className="text-2xl text-gray-300 mb-8">
                  Battle demogorgons with your team using advanced blockchain permissions
                </p>
              </div>

              <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-12 border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="text-center p-6 bg-gradient-to-br from-red-900/30 to-purple-900/30 rounded-2xl border border-red-500/30">
                    <div className="text-5xl mb-4">🗳️</div>
                    <h3 className="text-xl font-bold mb-2 text-yellow-400">Democratic Voting</h3>
                    <p className="text-sm text-gray-400">Vote on weapons as a team</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-2xl border border-purple-500/30">
                    <div className="text-5xl mb-4">⚡</div>
                    <h3 className="text-xl font-bold mb-2 text-yellow-400">Gasless Transactions</h3>
                    <p className="text-sm text-gray-400">Zero gas fees for players</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-900/30 to-green-900/30 rounded-2xl border border-blue-500/30">
                    <div className="text-5xl mb-4">🔐</div>
                    <h3 className="text-xl font-bold mb-2 text-yellow-400">ERC-7715 Permissions</h3>
                    <p className="text-sm text-gray-400">Funds stay in your wallet</p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xl text-gray-300 mb-6">Connect your wallet to begin</p>
                  <div className="flex justify-center">
                    <ConnectButton />
                  </div>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-black/40 rounded-xl p-4 border border-gray-700">
                  <div className="text-3xl font-bold text-yellow-400">5</div>
                  <div className="text-sm text-gray-400">Rounds</div>
                </div>
                <div className="bg-black/40 rounded-xl p-4 border border-gray-700">
                  <div className="text-3xl font-bold text-green-400">∞</div>
                  <div className="text-sm text-gray-400">Players</div>
                </div>
                <div className="bg-black/40 rounded-xl p-4 border border-gray-700">
                  <div className="text-3xl font-bold text-red-400">10s</div>
                  <div className="text-sm text-gray-400">Vote Time</div>
                </div>
                <div className="bg-black/40 rounded-xl p-4 border border-gray-700">
                  <div className="text-3xl font-bold text-purple-400">0</div>
                  <div className="text-sm text-gray-400">Gas Fees</div>
                </div>
              </div>
            </div>
          </div>
        ) : gamePhase === 'ghost-setup' ? (
          <GhostPaySetup 
            userAddress={address!} 
            onSetupComplete={handleGhostPaySetupComplete}
          />
        ) : gamePhase === 'lobby' ? (
          <GameLobby 
            userAddress={address!}
            onStartBattle={() => setGamePhase('character-selection')}
          />
        ) : gamePhase === 'character-selection' ? (
          <CharacterSelection
            userAddress={address!}
            currentRoom={currentRoom}
            onCharacterSelected={handleCharacterSelected}
            onBackToLobby={() => setGamePhase(currentRoom ? 'multiplayer' : 'lobby')}
          />
        ) : gamePhase === 'multiplayer-character-selection' ? (
          <MultiplayerCharacterSelection
            userAddress={address!}
            currentRoom={currentRoom!}
            onAllPlayersReady={handleMultiplayerCharactersReady}
            onBackToLobby={() => setGamePhase('multiplayer')}
          />
        ) : gamePhase === 'battle' ? (
          <ImprovedWarBattle 
            userAddress={address!}
            selectedCharacter={selectedCharacter}
            currentRoom={currentRoom}
            characterSelections={characterSelections}
            onBackToLobby={() => setGamePhase(currentRoom ? 'multiplayer' : 'lobby')}
          />
        ) : gamePhase === 'multiplayer' ? (
          <RoomLobby 
            onStartGame={handleMultiplayerGameStart}
            onBackToMenu={() => setGamePhase('menu')}
          />
        ) : (
          // Main Menu - Redesigned
          <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
            <div className="max-w-6xl w-full">
              {/* Hero Section */}
              <div className="text-center mb-16">
                <div className="flex justify-center space-x-4 mb-6">
                  <div className="text-7xl animate-bounce" style={{ animationDelay: '0s' }}>⚔️</div>
                  <div className="text-7xl animate-bounce" style={{ animationDelay: '0.2s' }}>🔥</div>
                  <div className="text-7xl animate-bounce" style={{ animationDelay: '0.4s' }}>👥</div>
                </div>
                <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-red-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Team Battle Arena
                </h2>
                <p className="text-2xl text-gray-300 mb-4">
                  Battle the Upside Down with democratic voting & gasless transactions
                </p>
                <div className="flex justify-center space-x-4 text-sm">
                  <span className="bg-green-500/20 border border-green-500 rounded-full px-4 py-1">
                    ✅ ERC-7715 Permissions
                  </span>
                  <span className="bg-blue-500/20 border border-blue-500 rounded-full px-4 py-1">
                    ⚡ Zero Gas Fees
                  </span>
                  <span className="bg-purple-500/20 border border-purple-500 rounded-full px-4 py-1">
                    🗳️ Democratic Voting
                  </span>
                </div>
              </div>

              {/* Main CTAs */}
              <div className="max-w-4xl mx-auto mb-12 space-y-6">
                {/* Wallet Setup CTA */}
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => window.location.href = '/wallet-setup'}
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-300" />
                  <div className="relative bg-gradient-to-br from-green-900/90 via-blue-900/90 to-purple-900/90 backdrop-blur-xl rounded-3xl p-8 border-2 border-green-500">
                    <div className="text-center">
                      <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">💰</div>
                      <h3 className="text-3xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                        Setup Wallet (Required)
                      </h3>
                      <p className="text-lg text-gray-300 mb-6">
                        Wrap MNT → WMANTLE • Approve contract • Play with game currency
                      </p>
                      <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-2xl transition-all transform group-hover:scale-105 shadow-2xl shadow-green-500/50">
                        <span className="text-xl">SETUP WALLET</span>
                        <span className="text-2xl">🔧</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Battle CTA */}
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => setGamePhase('multiplayer')}
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-purple-600 to-pink-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-red-900/90 via-purple-900/90 to-pink-900/90 backdrop-blur-xl rounded-3xl p-12 border-2 border-purple-500">
                    <div className="text-center">
                      <div className="text-8xl mb-6 group-hover:scale-110 transition-transform duration-300">👥</div>
                      <h3 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                        Enter Multiplayer Arena
                      </h3>
                      <p className="text-xl text-gray-300 mb-8">
                        Create or join rooms • Vote on weapons • Battle together
                      </p>
                      <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-5 px-10 rounded-2xl transition-all transform group-hover:scale-105 shadow-2xl shadow-yellow-500/50">
                        <span className="text-2xl">START BATTLE</span>
                        <span className="text-3xl animate-pulse">➤</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30 hover:border-red-500 transition-all hover:scale-105">
                  <div className="text-5xl mb-4">🎮</div>
                  <h4 className="text-xl font-bold mb-2 text-red-400">5 Rounds</h4>
                  <p className="text-sm text-gray-400">Progressive difficulty with boss battles</p>
                </div>
                <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 hover:border-purple-500 transition-all hover:scale-105">
                  <div className="text-5xl mb-4">💰</div>
                  <h4 className="text-xl font-bold mb-2 text-purple-400">Team Pool</h4>
                  <p className="text-sm text-gray-400">Everyone contributes, funds stay safe</p>
                </div>
                <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30 hover:border-blue-500 transition-all hover:scale-105">
                  <div className="text-5xl mb-4">🗳️</div>
                  <h4 className="text-xl font-bold mb-2 text-blue-400">Vote System</h4>
                  <p className="text-sm text-gray-400">10-second democratic weapon voting</p>
                </div>
                <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 hover:border-green-500 transition-all hover:scale-105">
                  <div className="text-5xl mb-4">⚡</div>
                  <h4 className="text-xl font-bold mb-2 text-green-400">Gasless</h4>
                  <p className="text-sm text-gray-400">Backend pays all gas fees</p>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="mt-12 bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-700">
                <h3 className="text-2xl font-bold text-center mb-6 text-gray-300">Powered By</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-3xl mb-2">🔐</div>
                    <div className="text-sm font-bold text-purple-400">ERC-7715</div>
                    <div className="text-xs text-gray-500">Permissions</div>
                  </div>
                  <div>
                    <div className="text-3xl mb-2">⛓️</div>
                    <div className="text-sm font-bold text-blue-400">Mantle</div>
                    <div className="text-xs text-gray-500">Sepolia</div>
                  </div>
                  <div>
                    <div className="text-3xl mb-2">⚡</div>
                    <div className="text-sm font-bold text-yellow-400">Gasless</div>
                    <div className="text-xs text-gray-500">Backend Relayer</div>
                  </div>
                  <div>
                    <div className="text-3xl mb-2">🦊</div>
                    <div className="text-sm font-bold text-orange-400">MetaMask</div>
                    <div className="text-xs text-gray-500">Web3 Wallet</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invitation Notifications */}
        {isConnected && isGhostPayActive && (
          <InvitationNotifications onJoinRoom={handleJoinRoomFromInvite} />
        )}
      </main>

      {/* Footer */}
      <footer className="relative bg-black/80 backdrop-blur-md border-t-2 border-red-500/50 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gray-400 mb-2">
              Built on <span className="text-blue-400 font-bold">Mantle Sepolia</span> • 
              Powered by <span className="text-purple-400 font-bold">ERC-7715</span> • 
              Gasless via <span className="text-green-400 font-bold">Backend Relayer</span>
            </p>
            <p className="text-gray-600 text-sm">
              Demo project showcasing advanced blockchain permissions & democratic gameplay
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}