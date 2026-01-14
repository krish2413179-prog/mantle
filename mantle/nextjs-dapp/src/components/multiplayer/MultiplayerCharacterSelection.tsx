'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Crown, Zap, Heart, Shield, Users, Check, Clock } from 'lucide-react'
import Image from 'next/image'

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

interface Player {
  address: string
  displayName: string
  isReady: boolean
  isHost: boolean
  selectedCharacter?: Character
  characterSelectionReady: boolean
}

interface Room {
  id: string
  code: string
  name: string
  host: string
  players: Player[]
  maxPlayers: number
  isPrivate: boolean
  createdAt: string
  gameMode: 'battle' | 'psychic-link'
}

interface MultiplayerCharacterSelectionProps {
  userAddress: string
  currentRoom: Room
  onAllPlayersReady: (room: Room, characterSelections: Record<string, Character>) => void
  onBackToLobby: () => void
}

const STRANGER_THINGS_CHARACTERS: Character[] = [
  {
    id: 'eleven',
    name: 'Eleven',
    image: '/assets/characters/eleven.png',
    description: 'The girl with psychic powers who can move objects with her mind and open portals.',
    specialAbility: 'Psychic Blast - Massive damage to all enemies',
    stats: { psychic: 100, combat: 60, tech: 40, leadership: 90 },
    isLeader: true
  },
  {
    id: 'steve',
    name: 'Steve Harrington',
    image: '/assets/characters/steve.png',
    description: 'Former king of Hawkins High, now the group\'s protector with his trusty nail bat.',
    specialAbility: 'Bat Swing - High damage melee attacks',
    stats: { psychic: 20, combat: 95, tech: 50, leadership: 80 }
  },
  {
    id: 'dustin',
    name: 'Dustin Henderson',
    image: '/assets/characters/dustin.png',
    description: 'The tech genius with his radio equipment and scientific knowledge.',
    specialAbility: 'Cerebro Communication - Coordinate team attacks',
    stats: { psychic: 30, combat: 60, tech: 100, leadership: 70 }
  },
  {
    id: 'max',
    name: 'Max Mayfield',
    image: '/assets/characters/max.png',
    description: 'Fearless skateboarder with quick reflexes and a brave heart.',
    specialAbility: 'Speed Boost - Increased attack speed and evasion',
    stats: { psychic: 40, combat: 85, tech: 60, leadership: 75 }
  },
  {
    id: 'mike',
    name: 'Mike Wheeler',
    image: '/assets/characters/mike.png',
    description: 'The strategist and natural leader of the group, always ready with a plan.',
    specialAbility: 'Battle Strategy - Boost team coordination',
    stats: { psychic: 25, combat: 70, tech: 75, leadership: 95 }
  },
  {
    id: 'lucas',
    name: 'Lucas Sinclair',
    image: '/assets/characters/lucas.png',
    description: 'Expert marksman with his slingshot, always ready for action.',
    specialAbility: 'Precision Shot - Critical hit chance increased',
    stats: { psychic: 20, combat: 90, tech: 65, leadership: 70 }
  },
  {
    id: 'will',
    name: 'Will Byers',
    image: '/assets/characters/will.png',
    description: 'Connected to the Upside Down, he can sense danger and enemy movements.',
    specialAbility: 'True Sight - Reveal hidden enemies and weak points',
    stats: { psychic: 80, combat: 50, tech: 70, leadership: 60 }
  },
  {
    id: 'nancy',
    name: 'Nancy Wheeler',
    image: '/assets/characters/nancy.png',
    description: 'Investigative journalist with combat skills and determination.',
    specialAbility: 'Investigative Strike - Expose enemy vulnerabilities',
    stats: { psychic: 35, combat: 85, tech: 80, leadership: 85 }
  },
  {
    id: 'robin',
    name: 'Robin Buckley',
    image: '/assets/characters/robin.png',
    description: 'Brilliant linguist and codebreaker who can decode enemy patterns.',
    specialAbility: 'Pattern Analysis - Predict enemy movements',
    stats: { psychic: 45, combat: 65, tech: 90, leadership: 75 }
  },
  {
    id: 'erica',
    name: 'Erica Sinclair',
    image: '/assets/characters/erica.png',
    description: 'Sassy and fearless, she can navigate tight spaces and distract enemies.',
    specialAbility: 'Stealth Mission - Bypass enemy defenses',
    stats: { psychic: 30, combat: 75, tech: 70, leadership: 80 }
  }
]

export function MultiplayerCharacterSelection({ 
  userAddress, 
  currentRoom, 
  onAllPlayersReady, 
  onBackToLobby 
}: MultiplayerCharacterSelectionProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [playersStatus, setPlayersStatus] = useState<Record<string, { character?: Character; ready: boolean }>>({})
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [timeLeft, setTimeLeft] = useState(60) // 60 second timer
  
  const wsRef = useRef<WebSocket | null>(null)

  // Add comprehensive null checks for currentRoom
  if (!currentRoom) {
    console.error('❌ MultiplayerCharacterSelection: currentRoom is null/undefined')
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900/20 via-purple-900/20 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Room Data Missing</h2>
          <p className="text-gray-300 mb-6">Unable to load room information - currentRoom is null</p>
          <button
            onClick={onBackToLobby}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  if (!currentRoom.players || !Array.isArray(currentRoom.players)) {
    console.error('❌ MultiplayerCharacterSelection: currentRoom.players is invalid:', currentRoom.players)
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900/20 via-purple-900/20 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Invalid Room Data</h2>
          <p className="text-gray-300 mb-6">Room players data is missing or invalid</p>
          <button
            onClick={onBackToLobby}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  console.log('🎭 MultiplayerCharacterSelection initialized with room:', {
    code: currentRoom.code,
    playersCount: currentRoom.players.length,
    players: currentRoom.players.map(p => ({ address: p.address, name: p.displayName, isHost: p.isHost }))
  })

  useEffect(() => {
    connectWebSocket()
    
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-select random character if time runs out
          if (!selectedCharacter) {
            const randomChar = STRANGER_THINGS_CHARACTERS[Math.floor(Math.random() * STRANGER_THINGS_CHARACTERS.length)]
            setSelectedCharacter(randomChar)
            setIsReady(true)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => {
      clearInterval(timer)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const connectWebSocket = () => {
    try {
      console.log('🔗 Attempting to connect to character selection WebSocket...')
      const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081')
      wsRef.current = ws

      ws.onopen = () => {
        console.log('🔗 Connected to character selection WebSocket')
        setConnectionStatus('connected')
        
        // Join character selection room
        const message = {
          type: 'JOIN_CHARACTER_SELECTION',
          payload: { 
            roomCode: currentRoom.code,
            playerAddress: userAddress,
            playerName: currentRoom.players.find(p => p.address === userAddress)?.displayName || 'Player'
          }
        }
        console.log('📤 Sending JOIN_CHARACTER_SELECTION:', message)
        ws.send(JSON.stringify(message))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 Received character selection message:', data)
          handleWebSocketMessage(data)
        } catch (error) {
          console.error('WebSocket message parse error:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('📡 Disconnected from character selection WebSocket', event.code, event.reason)
        setConnectionStatus('disconnected')
      }

      ws.onerror = (error) => {
        console.error('WebSocket connection error:', error)
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionStatus('disconnected')
    }
  }

  const handleWebSocketMessage = (data: any) => {
    const { type, payload } = data

    switch (type) {
      case 'CHARACTER_SELECTION_UPDATE':
        setPlayersStatus(payload.playersStatus)
        break
      case 'ALL_PLAYERS_READY':
        console.log('🎉 All players ready! Starting battle...')
        onAllPlayersReady(currentRoom, payload.characterSelections)
        break
    }
  }

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character)
  }

  const handleToggleReady = () => {
    if (!selectedCharacter) return
    
    const newReadyState = !isReady
    setIsReady(newReadyState)
    
    // Send character selection to server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'CHARACTER_SELECTED',
        payload: {
          roomCode: currentRoom.code,
          playerAddress: userAddress,
          character: selectedCharacter,
          ready: newReadyState
        }
      }
      console.log('📤 Sending CHARACTER_SELECTED:', message)
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.error('❌ WebSocket not connected, cannot send character selection')
      setConnectionStatus('disconnected')
    }
  }

  const allPlayersReady = Object.keys(playersStatus).length === currentRoom.players.length &&
    Object.values(playersStatus).every(status => status.ready)

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900/20 via-purple-900/20 to-black text-white">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-red-500/30 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToLobby}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Lobby</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
              🎭 Team Character Selection
            </h1>
            <p className="text-sm text-gray-400">Room: {currentRoom.code} • {currentRoom.players.length} Players</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
              connectionStatus === 'connected' ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">{connectionStatus.toUpperCase()}</span>
            </div>
            
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg px-3 py-1">
              <Clock className="w-4 h-4 inline mr-1" />
              <span className="text-sm font-mono">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Character Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {STRANGER_THINGS_CHARACTERS.map((character) => {
                const isSelected = selectedCharacter?.id === character.id
                const isTakenByOther = Object.values(playersStatus).some(status => 
                  status.character?.id === character.id && status.character.id !== selectedCharacter?.id
                )
                
                return (
                  <motion.div
                    key={character.id}
                    whileHover={{ scale: isTakenByOther ? 1 : 1.05 }}
                    whileTap={{ scale: isTakenByOther ? 1 : 0.95 }}
                    className={`relative cursor-pointer rounded-xl p-4 border-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/20'
                        : isTakenByOther
                        ? 'border-red-500 bg-red-500/10 opacity-50 cursor-not-allowed'
                        : 'border-gray-600 bg-black/30 hover:border-gray-500'
                    }`}
                    onClick={() => !isTakenByOther && handleCharacterSelect(character)}
                  >
                    {character.isLeader && (
                      <Crown className="w-4 h-4 text-yellow-500 absolute top-2 right-2" />
                    )}
                    
                    {isTakenByOther && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        TAKEN
                      </div>
                    )}
                    
                    <div className="w-20 h-20 relative mx-auto mb-3">
                      <Image
                        src={character.image}
                        alt={character.name}
                        fill
                        className="object-cover rounded-full border-2 border-purple-500"
                        unoptimized
                      />
                    </div>
                    
                    <h3 className="text-sm font-bold text-center text-white mb-1">
                      {character.name}
                    </h3>
                    
                    <div className="text-xs text-center text-gray-400">
                      {character.specialAbility.split(' - ')[0]}
                    </div>
                    
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-purple-500/20 rounded-xl flex items-center justify-center"
                      >
                        <div className="text-purple-400 text-2xl">✓</div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Team Status */}
          <div className="lg:col-span-1">
            <div className="bg-black/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 sticky top-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-500" />
                Team Status
              </h3>
              
              <div className="space-y-4 mb-6">
                {currentRoom.players.map((player) => {
                  const status = playersStatus[player.address]
                  const isCurrentPlayer = player.address === userAddress
                  
                  return (
                    <div key={player.address} className="bg-black/40 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {player.isHost && <Crown className="w-4 h-4 text-yellow-500" />}
                          <span className="text-sm font-semibold">
                            {isCurrentPlayer ? 'You' : player.displayName}
                          </span>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          status?.ready ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                      </div>
                      
                      {status?.character ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 relative">
                            <Image
                              src={status.character.image}
                              alt={status.character.name}
                              fill
                              className="object-cover rounded-full"
                              unoptimized
                            />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-purple-400">
                              {status.character.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {status.ready ? '✅ Ready' : '⏳ Selecting...'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">
                          {isCurrentPlayer ? 'Select your character' : 'Choosing character...'}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {selectedCharacter && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-purple-400 mb-2">Your Selection</h4>
                  <div className="bg-purple-500/20 border border-purple-500 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 relative">
                        <Image
                          src={selectedCharacter.image}
                          alt={selectedCharacter.name}
                          fill
                          className="object-cover rounded-full"
                          unoptimized
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{selectedCharacter.name}</div>
                        <div className="text-xs text-purple-300">{selectedCharacter.specialAbility}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleToggleReady}
                disabled={!selectedCharacter}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  !selectedCharacter
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : isReady
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {!selectedCharacter ? 'Select Character First' : 
                 isReady ? '✅ Ready for Battle!' : '🎯 Confirm Selection'}
              </button>

              {allPlayersReady && (
                <div className="mt-4 text-center">
                  <div className="text-green-400 text-sm font-semibold animate-pulse">
                    🚀 Starting battle in 3 seconds...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}