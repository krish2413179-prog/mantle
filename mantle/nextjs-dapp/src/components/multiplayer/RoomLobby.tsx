'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Copy, Share2, Crown, Zap, X, Check } from 'lucide-react'
import { useAccount } from 'wagmi'

interface Player {
  address: string
  displayName: string
  isReady: boolean
  isHost: boolean
  joinedAt: string
  teamLeader?: string
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

interface RoomLobbyProps {
  onStartGame: (room: Room) => void
  onBackToMenu: () => void
}

export function RoomLobby({ onStartGame, onBackToMenu }: RoomLobbyProps) {
  const { address } = useAccount()
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [isJoiningRoom, setIsJoiningRoom] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [roomName, setRoomName] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const maxReconnectAttempts = 3
  const [isSyncing, setIsSyncing] = useState(false)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [logs, setLogs] = useState<string[]>([
    '🌐 Multiplayer system initialized',
    '🔗 Ready to connect with teammates'
  ])
  
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Only connect once when component mounts
    connectWebSocket()
    
    // Try to restore room from localStorage on component mount
    const savedRoom = localStorage.getItem('currentRoom')
    if (savedRoom && address) {
      try {
        const roomData = JSON.parse(savedRoom)
        // Only restore if the room belongs to current address
        if (roomData.players.some((p: Player) => p.address.toLowerCase() === address.toLowerCase())) {
          setCurrentRoom(roomData)
          addLog(`🔄 Restored room: ${roomData.name}`)
          
          // Try to rejoin the room via WebSocket when connection is ready
          let rejoinAttempts = 0
          const maxRejoinAttempts = 2
          
          const attemptRejoin = () => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && rejoinAttempts < maxRejoinAttempts) {
              rejoinAttempts++
              wsRef.current.send(JSON.stringify({
                type: 'REJOIN_ROOM',
                payload: {
                  roomCode: roomData.code,
                  playerAddress: address
                }
              }))
              addLog(`🔄 Attempting to rejoin room... (${rejoinAttempts}/${maxRejoinAttempts})`)
            } else if (rejoinAttempts >= maxRejoinAttempts) {
              // Failed to rejoin, clear the stored room
              setCurrentRoom(null)
              localStorage.removeItem('currentRoom')
              addLog('❌ Failed to rejoin room, cleared stored data')
            } else {
              // WebSocket not ready, try again in 2 seconds
              setTimeout(attemptRejoin, 2000)
            }
          }
          
          setTimeout(attemptRejoin, 2000) // Wait longer for connection to stabilize
        } else {
          // Room doesn't belong to current address, clear it
          localStorage.removeItem('currentRoom')
        }
      } catch (error) {
        console.error('Failed to restore room:', error)
        localStorage.removeItem('currentRoom')
      }
    }
    
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
      if (wsRef.current) {
        wsRef.current.onclose = null // Prevent reconnection on unmount
        wsRef.current.close()
      }
    }
  }, [address]) // Only re-run when address changes

  const connectWebSocket = () => {
    // Debounce connection attempts
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
    }
    
    connectionTimeoutRef.current = setTimeout(() => {
      try {
        setConnectionStatus('connecting')
        
        // Close existing connection if any
        if (wsRef.current) {
          wsRef.current.onclose = null // Remove event listeners to prevent loops
          wsRef.current.onerror = null
          wsRef.current.close()
          wsRef.current = null
        }
        
        // Don't create new connection if we're already connected
        if (connectionStatus === 'connected') {
          return
        }
        
        wsRef.current = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081')
        
        wsRef.current.onopen = () => {
          setConnectionStatus('connected')
          setReconnectAttempts(0) // Reset reconnect attempts on successful connection
          addLog('🔗 Connected to multiplayer server')
          
          // Start heartbeat to keep connection alive
          if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current)
          }
          heartbeatRef.current = setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'HEARTBEAT',
                payload: { timestamp: Date.now() }
              }))
            }
          }, 30000) // Send heartbeat every 30 seconds
        }
        
        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            handleWebSocketMessage(data)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }
        
        wsRef.current.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason)
          setConnectionStatus('disconnected')
          addLog('📡 Disconnected from server')
          
          // Clear heartbeat
          if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current)
            heartbeatRef.current = null
          }
          
          // Only try to reconnect if it wasn't a clean close and we haven't exceeded max attempts
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000) // Exponential backoff, max 10s
            setTimeout(() => {
              if (connectionStatus === 'disconnected') {
                setReconnectAttempts(prev => prev + 1)
                addLog(`🔄 Attempting to reconnect... (${reconnectAttempts + 1}/${maxReconnectAttempts})`)
                connectWebSocket()
              }
            }, delay)
          } else if (event.code !== 1000) {
            addLog('❌ Max reconnection attempts reached. Please refresh the page.')
            // Clear any stored room data if we can't reconnect
            setCurrentRoom(null)
            localStorage.removeItem('currentRoom')
          }
        }
        
        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error)
          setConnectionStatus('disconnected')
          addLog('❌ Connection error')
        }
      } catch (error) {
        console.error('Failed to create WebSocket:', error)
        setConnectionStatus('disconnected')
        addLog('❌ Failed to connect to server')
      }
    }, 500) // 500ms debounce
  }

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'ROOM_CREATED':
        setCurrentRoom(data.room)
        setIsCreatingRoom(false)
        localStorage.setItem('currentRoom', JSON.stringify(data.room))
        addLog(`🏠 Room "${data.room.name}" created with code: ${data.room.code}`)
        break
      case 'ROOM_JOINED':
        setCurrentRoom(data.room)
        setIsJoiningRoom(false)
        localStorage.setItem('currentRoom', JSON.stringify(data.room))
        addLog(`🚪 Joined room "${data.room.name}"`)
        break
      case 'ROOM_REJOINED':
        console.log('🔄 ROOM_REJOINED received:', data.room)
        console.log('  Players in room:', data.room.players.length)
        console.log('  Players:', data.room.players.map((p: Player) => ({ name: p.displayName, isHost: p.isHost })))
        setCurrentRoom(data.room)
        localStorage.setItem('currentRoom', JSON.stringify(data.room))
        addLog(`🔄 Rejoined room "${data.room.name}" with ${data.room.players.length} players`)
        break
      case 'ROOM_LEFT':
        console.log('Received ROOM_LEFT message')
        setCurrentRoom(null)
        localStorage.removeItem('currentRoom')
        addLog('👋 Successfully left the room')
        break
      case 'PLAYER_JOINED':
        console.log('📨 Received PLAYER_JOINED:', data)
        console.log('  📊 data.room:', data.room)
        console.log('  📊 data.room.players:', data.room?.players)
        console.log('  📊 data.players:', data.players)
        
        if (data.room) {
          // Use functional update to avoid stale closure
          setCurrentRoom(prevRoom => {
            console.log('  📊 prevRoom in functional update:', prevRoom)
            
            // ALWAYS use data.room if it exists
            const updatedRoom = data.room
            console.log('  ✅ Using data.room - players count:', updatedRoom.players.length)
            console.log('  ✅ Players:', updatedRoom.players.map((p: Player) => p.displayName))
            
            // Force a new object reference to trigger React re-render
            const newRoom = { ...updatedRoom, players: [...updatedRoom.players] }
            localStorage.setItem('currentRoom', JSON.stringify(newRoom))
            console.log('✅ Updated room with new player:', newRoom.players.length, 'players')
            console.log('✅ Room players:', newRoom.players.map((p: Player) => ({ name: p.displayName, isHost: p.isHost })))
            return newRoom
          })
          
          addLog(`👋 ${data.player.displayName} joined the room`)
        } else if (data.players) {
          // Fallback: just update players array
          setCurrentRoom(prevRoom => {
            if (!prevRoom) {
              console.log('  ❌ prevRoom is null, cannot update')
              return prevRoom
            }
            
            console.log('  ⚠️  Using fallback - data.players count:', data.players.length)
            const updatedRoom = { ...prevRoom, players: [...data.players] }
            localStorage.setItem('currentRoom', JSON.stringify(updatedRoom))
            console.log('✅ Updated room with new player (fallback):', updatedRoom.players.length, 'players')
            return updatedRoom
          })
          
          addLog(`👋 ${data.player.displayName} joined the room`)
        } else {
          console.log('  ❌ Could not update room - data.room:', !!data.room, 'data.players:', !!data.players)
        }
        break
      case 'PLAYER_LEFT':
        console.log('📨 Received PLAYER_LEFT:', data)
        if (data.players) {
          setCurrentRoom(prevRoom => {
            if (!prevRoom) return prevRoom
            const updatedRoom = { ...prevRoom, players: [...data.players] }
            localStorage.setItem('currentRoom', JSON.stringify(updatedRoom))
            return updatedRoom
          })
          addLog(`👋 ${data.player.displayName} left the room`)
        }
        break
      case 'PLAYER_READY':
        console.log('📨 Received PLAYER_READY:', data)
        console.log('  📊 data.player:', data.player)
        console.log('  📊 data.players:', data.players)
        console.log('  📊 data.players details:', data.players?.map((p: Player) => ({ 
          address: p.address, 
          displayName: p.displayName, 
          isReady: p.isReady,
          isHost: p.isHost 
        })))
        
        if (data.players) {
          // Use functional update to avoid stale closure
          setCurrentRoom(prevRoom => {
            console.log('  📊 prevRoom in functional update:', prevRoom)
            if (!prevRoom) {
              console.log('  ❌ prevRoom is null, cannot update')
              return prevRoom
            }
            
            // Force new object reference to trigger React re-render
            const updatedRoom = { ...prevRoom, players: [...data.players] }
            console.log('  ✅ Creating updated room with players:', updatedRoom.players.length)
            console.log('  ✅ Updated players:', updatedRoom.players.map((p: Player) => ({ 
              displayName: p.displayName, 
              isReady: p.isReady 
            })))
            
            localStorage.setItem('currentRoom', JSON.stringify(updatedRoom))
            console.log('✅ State updated - should trigger re-render')
            return updatedRoom
          })
          
          addLog(`✅ ${data.player.displayName} is ${data.player.isReady ? 'ready' : 'not ready'}`)
        } else {
          console.log('  ❌ Cannot update - data.players is missing')
        }
        break
      case 'ROOM_UPDATED':
        // Handle general room updates
        if (currentRoom && data.room.code === currentRoom.code) {
          setCurrentRoom(data.room)
          localStorage.setItem('currentRoom', JSON.stringify(data.room))
          setIsSyncing(false)
        }
        break
      case 'PLAYER_REJOINED':
        if (currentRoom) {
          addLog(`🔄 ${data.player.displayName} reconnected`)
        }
        break
      case 'PONG':
        console.log('Received PONG:', data)
        addLog(`🏓 Server responded: ${data.payload.message}`)
        break
      case 'GAME_STARTING':
        console.log('📨 Received GAME_STARTING:', data)
        console.log('📨 GAME_STARTING data.room:', data.room)
        console.log('📨 GAME_STARTING currentRoom:', currentRoom)
        addLog('🎮 Game starting...')
        // Use the room data from the message if available, otherwise use currentRoom
        const roomData = data.room || currentRoom;
        console.log('🎮 Passing room data to character selection:', roomData)
        console.log('🎮 Room has players:', roomData?.players?.length || 0)
        if (roomData && roomData.players && roomData.players.length > 0) {
          setTimeout(() => onStartGame(roomData), 2000)
        } else {
          console.error('❌ Invalid room data in GAME_STARTING:', roomData)
          addLog('❌ Failed to start game - invalid room data')
        }
        break
      case 'ERROR':
        console.log('Received ERROR:', data.message)
        addLog(`❌ ${data.message}`)
        setIsCreatingRoom(false)
        setIsJoiningRoom(false)
        
        // If error is about room not existing, clear stored room data
        if (data.message.includes('Room no longer exists') || 
            data.message.includes('Room not found') ||
            data.message.includes('You are not in this room')) {
          console.log('Clearing stored room due to error')
          setCurrentRoom(null)
          localStorage.removeItem('currentRoom')
          addLog('🧹 Cleared invalid room data')
        }
        break
    }
  }

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), message])
  }

  useEffect(() => {
    console.log('🔄 currentRoom state changed:', currentRoom)
    console.log('  Players count:', currentRoom?.players?.length || 0)
    console.log('  Players:', currentRoom?.players?.map((p: Player) => ({ name: p.displayName, isHost: p.isHost })) || [])
  }, [currentRoom])

  useEffect(() => {
    if (!currentRoom || !address) return
    
    // Periodic room sync to ensure we have latest data
    const syncInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'SYNC_ROOM',
          payload: {
            roomCode: currentRoom.code,
            playerAddress: address
          }
        }))
      }
    }, 10000) // Sync every 10 seconds
    
    return () => clearInterval(syncInterval)
  }, [currentRoom, address])

  const createRoom = async () => {
    if (!address || !roomName.trim()) return
    
    setIsCreatingRoom(true)
    
    const room: Room = {
      id: `room_${Date.now()}`,
      code: generateRoomCode(),
      name: roomName.trim(),
      host: address,
      players: [{
        address,
        displayName: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
        isReady: false,
        isHost: true,
        joinedAt: new Date().toISOString()
      }],
      maxPlayers: 4,
      isPrivate: false,
      createdAt: new Date().toISOString(),
      gameMode: 'battle'
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'CREATE_ROOM',
        payload: room
      }))
    } else {
      addLog('❌ Not connected to server')
      setIsCreatingRoom(false)
    }
  }

  const joinRoom = async () => {
    if (!address || !roomCode.trim()) return
    
    setIsJoiningRoom(true)
    
    const player: Player = {
      address,
      displayName: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
      isReady: false,
      isHost: false,
      joinedAt: new Date().toISOString()
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'JOIN_ROOM',
        payload: {
          roomCode: roomCode.trim().toUpperCase(),
          player
        }
      }))
    } else {
      addLog('❌ Not connected to server')
      setIsJoiningRoom(false)
    }
  }

  const toggleReady = () => {
    if (!currentRoom || !address) return
    
    console.log('Toggle ready clicked', { currentRoom: currentRoom.code, address })
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'TOGGLE_READY',
        payload: {
          roomCode: currentRoom.code,
          playerAddress: address
        }
      }
      console.log('Sending toggle ready message:', message)
      wsRef.current.send(JSON.stringify(message))
      addLog(`🔄 Toggling ready status...`)
    } else {
      addLog('❌ Not connected to server')
      console.log('WebSocket not ready:', wsRef.current?.readyState)
    }
  }

  const startGame = () => {
    if (!currentRoom || !address) return
    
    const isHost = currentRoom.players.find(p => p.address === address)?.isHost
    const isRoomHost = currentRoom.host.toLowerCase() === address.toLowerCase()
    
    console.log('🎮 Start game attempt:', { isHost, isRoomHost, address, roomHost: currentRoom.host })
    
    if (!isHost || !isRoomHost) {
      console.log('❌ Not authorized to start game - only host can start')
      return
    }
    
    const allReady = currentRoom.players.every(p => p.isReady || p.isHost)
    if (!allReady) {
      addLog('❌ All players must be ready to start')
      return
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'START_GAME',
        payload: {
          roomCode: currentRoom.code,
          hostAddress: address
        }
      }))
    }
  }

  const leaveRoom = () => {
    if (!currentRoom || !address) {
      console.log('Leave room failed: missing room or address', { currentRoom: currentRoom?.code, address })
      return
    }
    
    console.log('Leave room clicked', { roomCode: currentRoom.code, address })
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'LEAVE_ROOM',
        payload: {
          roomCode: currentRoom.code,
          playerAddress: address
        }
      }
      console.log('Sending leave room message:', message)
      wsRef.current.send(JSON.stringify(message))
      addLog('👋 Leaving room...')
    } else {
      addLog('❌ Not connected to server')
      console.log('WebSocket not ready for leave:', wsRef.current?.readyState)
    }
    setShowLeaveConfirm(false)
  }

  const confirmLeaveRoom = () => {
    setShowLeaveConfirm(true)
  }

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const copyRoomCode = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.code)
      addLog('📋 Room code copied to clipboard')
    }
  }

  const shareRoom = () => {
    if (currentRoom) {
      const shareText = `Join my Stranger Things Battle room!\nRoom Code: ${currentRoom.code}\nRoom Name: ${currentRoom.name}`
      
      if (navigator.share) {
        navigator.share({
          title: 'Stranger Things Battle - Join Room',
          text: shareText
        })
      } else {
        navigator.clipboard.writeText(shareText)
        addLog('📋 Room details copied to clipboard')
      }
    }
  }

  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-red-900/20 to-black text-white">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
              🔥 MULTIPLAYER LOBBY 🔥
            </h1>
            <p className="text-xl text-gray-300">Team up with friends and battle the Upside Down together!</p>
            
            <div className="flex justify-center items-center space-x-4 mt-6">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500/20 border border-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500/20 border border-yellow-500' :
                'bg-red-500/20 border border-red-500'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`} />
                <span className="text-sm">
                  {connectionStatus === 'connected' ? 'Connected' :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   'Disconnected'}
                </span>
              </div>
              
              {connectionStatus === 'disconnected' && (
                <button
                  onClick={connectWebSocket}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Reconnect
                </button>
              )}
              
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={async () => {
                    try {
                      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/rooms/clear`, { method: 'DELETE' })
                      addLog('🧹 Cleared all rooms')
                    } catch (error) {
                      addLog('❌ Failed to clear rooms')
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Clear Rooms
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Room */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <Crown className="w-8 h-8 mr-3 text-yellow-500" />
                Create Room
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Room Name</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Enter room name..."
                    className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                    maxLength={30}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Game Mode</label>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-4 rounded-lg border-2 border-red-500 bg-red-500/20 text-red-300">
                      <div className="text-2xl mb-2">⚔️</div>
                      <div className="font-semibold">Battle Mode</div>
                      <div className="text-xs">Up to 4 players</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={createRoom}
                  disabled={!roomName.trim() || isCreatingRoom || connectionStatus !== 'connected'}
                  className="w-full bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 text-lg"
                >
                  {isCreatingRoom ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Creating Room...
                    </div>
                  ) : (
                    '🏠 Create Room'
                  )}
                </button>
              </div>
            </div>

            {/* Join Room */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-cyan-500/30">
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <Users className="w-8 h-8 mr-3 text-cyan-500" />
                Join Room
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Room Code</label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit room code..."
                    className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                  />
                </div>

                <button
                  onClick={joinRoom}
                  disabled={!roomCode.trim() || isJoiningRoom || connectionStatus !== 'connected'}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 text-lg"
                >
                  {isJoiningRoom ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Joining Room...
                    </div>
                  ) : (
                    '🚪 Join Room'
                  )}
                </button>

                <div className="text-center">
                  <button
                    onClick={onBackToMenu}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ← Back to Main Menu
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="mt-8 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-green-500" />
              Activity Logs
            </h3>
            <div className="bg-black/50 rounded-lg p-4 h-32 overflow-y-auto">
              <div className="space-y-1 text-sm font-mono">
                {logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="text-green-400"
                  >
                    {log}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Room View
  const currentPlayer = currentRoom.players.find(p => p.address.toLowerCase() === address?.toLowerCase())
  const isHost = currentPlayer?.isHost === true && currentRoom.host.toLowerCase() === address?.toLowerCase()
  const allReady = currentRoom.players.every(p => p.isReady || p.isHost)

  // Debug logging - log on every render to track state changes
  console.log('🎨 RoomLobby render - Room state:', {
    currentRoomCode: currentRoom?.code,
    playersCount: currentRoom?.players?.length || 0,
    players: currentRoom?.players?.map((p: Player) => p.displayName) || [],
    address,
    isHost,
    allReady
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-red-900/20 to-black text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Room Header */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-yellow-400">{currentRoom.name}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">Room Code:</span>
                  <span className="font-mono text-2xl text-white bg-black/50 px-3 py-1 rounded">{currentRoom.code}</span>
                  <button
                    onClick={copyRoomCode}
                    className="p-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                    title="Copy room code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={shareRoom}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    title="Share room"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-sm text-gray-400">
                  ⚔️ Battle Mode
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentRoom) {
                    setIsSyncing(true)
                    wsRef.current.send(JSON.stringify({
                      type: 'SYNC_ROOM',
                      payload: {
                        roomCode: currentRoom.code,
                        playerAddress: address
                      }
                    }))
                    addLog('🔄 Refreshing room data...')
                    
                    // Reset syncing state after timeout
                    setTimeout(() => setIsSyncing(false), 3000)
                  }
                }}
                disabled={isSyncing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                title="Refresh room data"
              >
                {isSyncing ? '⏳' : '🔄'}
              </button>
              
              <button
                onClick={confirmLeaveRoom}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Players List */}
          <div className="lg:col-span-2">
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Users className="w-6 h-6 mr-2 text-purple-500" />
                Players ({currentRoom.players.length}/{currentRoom.maxPlayers})
              </h2>
              
              <div className="space-y-4">
                {currentRoom.players.map((player) => (
                  <motion.div
                    key={`${player.address}-${player.isReady}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-black/40 rounded-xl p-4 border-2 ${
                      player.isReady ? 'border-green-500' : 'border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                          player.isHost ? 'bg-yellow-500/20 border-2 border-yellow-500' : 'bg-purple-500/20 border-2 border-purple-500'
                        }`}>
                          {player.isHost ? '👑' : '👤'}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{player.displayName}</span>
                            {player.isHost && <Crown className="w-4 h-4 text-yellow-500" />}
                          </div>
                          <div className="text-sm text-gray-400 font-mono">{player.address}</div>
                          <div className="text-xs text-gray-500">
                            Joined: {new Date(player.joinedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {player.isReady ? (
                          <div className="flex items-center space-x-2 text-green-500">
                            <Check className="w-5 h-5" />
                            <span className="font-semibold">Ready</span>
                          </div>
                        ) : (
                          <div className="text-gray-400">
                            {player.isHost ? 'Host' : 'Not Ready'}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: currentRoom.maxPlayers - currentRoom.players.length }).map((_, index) => (
                  <div key={`empty-${index}`} className="bg-black/20 rounded-xl p-4 border-2 border-dashed border-gray-600">
                    <div className="flex items-center justify-center text-gray-500 py-4">
                      <span className="text-2xl mr-2">👤</span>
                      <span>Waiting for player...</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Ready/Start Button */}
              <div className="mt-8 flex space-x-4">
                {/* Debug info */}
                <div className="w-full text-xs text-gray-400 mb-2">
                  Debug: isHost={isHost.toString()}, currentPlayer={currentPlayer?.displayName}, ready={currentPlayer?.isReady?.toString()}
                  <br />
                  Room Host: {currentRoom.host}, My Address: {address}
                  <br />
                  Players: {currentRoom.players.map((p: Player) => `${p.displayName}(host:${p.isHost})`).join(', ')}
                </div>
                
                {!isHost && (
                  <button
                    onClick={toggleReady}
                    className={`flex-1 font-bold py-4 px-6 rounded-xl transition-all duration-200 text-lg ${
                      currentPlayer?.isReady
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {currentPlayer?.isReady ? '❌ Not Ready' : '✅ Ready Up'}
                  </button>
                )}
                
                {isHost && (
                  <button
                    onClick={startGame}
                    disabled={!allReady || currentRoom.players.length < 1}
                    className="flex-1 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 text-lg"
                  >
                    {allReady && currentRoom.players.length >= 1 ? '🚀 Start Game' : '⏳ Waiting for Players to Ready Up'}
                  </button>
                )}
                
                {!isHost && (
                  <div className="flex-1 bg-gray-600 text-gray-300 font-bold py-4 px-6 rounded-xl text-lg text-center">
                    👑 Waiting for Host to Start Game
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Room Info & Logs */}
          <div className="space-y-6">
            {/* Room Info */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
              <h3 className="text-lg font-bold mb-4 text-cyan-400">Room Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span>{new Date(currentRoom.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Host:</span>
                  <span className="font-mono">{currentRoom.host.substring(0, 6)}...{currentRoom.host.substring(currentRoom.host.length - 4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mode:</span>
                  <span>⚔️ Battle</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Players:</span>
                  <span>{currentRoom.players.length}/{currentRoom.maxPlayers}</span>
                </div>
              </div>
            </div>

            {/* Activity Logs */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-green-500" />
                Activity Logs
              </h3>
              <div className="bg-black/50 rounded-lg p-4 h-64 overflow-y-auto">
                <div className="space-y-1 text-sm font-mono">
                  {logs.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="text-green-400"
                    >
                      {log}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Room Confirmation Modal */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowLeaveConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-black/90 border border-red-500 rounded-2xl p-8 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold text-red-400 mb-4">Leave Room?</h3>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to leave "{currentRoom?.name}"? 
                  {currentRoom?.players.find(p => p.address === address)?.isHost && 
                    " As the host, leaving will transfer control to another player."}
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowLeaveConfirm(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={leaveRoom}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    Leave Room
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}