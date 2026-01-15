'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Shield, Flame, Rocket, Skull, Users, ArrowLeft, AlertTriangle } from 'lucide-react'
import Image from 'next/image'

interface Character {
  id: string
  name: string
  image: string
}

interface TeamMember {
  address: string
  displayName: string
  characterName: string
  characterImage: string
  isTeamLeader: boolean
  delegatedAmount: number
  spentAmount: number
  isActive: boolean
  lastAction: string
}

interface WeaponVote {
  weaponId: string
  weaponName: string
  proposedBy: string
  proposedByName: string
  votes: string[] // Array of voter addresses
  startTime: number
  endTime: number
  status: 'active' | 'passed' | 'failed'
}

interface Enemy {
  id: string
  type: string
  health: number
  maxHealth: number
  damage: number
  position: { x: number; y: number }
  isDestroyed: boolean
  image: string
}

interface Transaction {
  id: string
  weapon: string
  cost: number
  spentFrom: Array<{ address: string; amount: number }>
  timestamp: string
  success: boolean
  transactionHash?: string
}

interface ImprovedWarBattleProps {
  userAddress: string
  selectedCharacter: Character | null
  currentRoom: any
  characterSelections: Record<string, Character>
  onBackToLobby: () => void
}

const WEAPONS = [
  { id: 'molotov', name: 'Molotov Cocktail', cost: 0.001, damage: 150, icon: '🔥', color: 'orange' },
  { id: 'flamethrower', name: 'Flamethrower', cost: 0.003, damage: 300, icon: '🔥', color: 'red' },
  { id: 'grenade', name: 'Grenade Launcher', cost: 0.005, damage: 500, icon: '💥', color: 'yellow' },
  { id: 'rocket', name: 'Rocket Launcher', cost: 0.008, damage: 800, icon: '🚀', color: 'blue' },
  { id: 'nuke', name: 'Nuclear Warhead', cost: 0.015, damage: 1500, icon: '☢️', color: 'purple' }
]

export function ImprovedWarBattle({
  userAddress,
  selectedCharacter,
  currentRoom,
  characterSelections,
  onBackToLobby
}: ImprovedWarBattleProps) {
  const [battleId, setBattleId] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [battlePhase, setBattlePhase] = useState<'loading' | 'delegation' | 'battle' | 'victory' | 'defeat'>('loading')
  const [selectedWeapon, setSelectedWeapon] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [showDelegatePrompt, setShowDelegatePrompt] = useState(false)
  const [attackAnimation, setAttackAnimation] = useState<string | null>(null)
  const [transactionPending, setTransactionPending] = useState(false)
  const [activeVote, setActiveVote] = useState<WeaponVote | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [currentRound, setCurrentRound] = useState<number>(1)
  const [showRoundTransition, setShowRoundTransition] = useState(false)
  
  // Detect solo mode: no room or only 1 player
  const isSoloMode = !currentRoom || !currentRoom.players || currentRoom.players.length < 2
  
  const wsRef = useRef<WebSocket | null>(null)
  const voteTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLeader = teamMembers.find(m => m.address.toLowerCase() === userAddress?.toLowerCase())?.isTeamLeader || false
  const currentMember = teamMembers.find(m => m.address.toLowerCase() === userAddress?.toLowerCase())
  const hasVoted = activeVote?.votes.includes(userAddress) || false
  const totalPlayers = teamMembers.length
  const votesNeeded = Math.max(2, Math.ceil(totalPlayers / 2)) // Minimum 2 votes, or majority

  // Debug: Log team members whenever they change
  useEffect(() => {
    console.log('👥 Team members updated:', teamMembers)
  }, [teamMembers])

  // Vote countdown timer
  useEffect(() => {
    if (activeVote && activeVote.status === 'active') {
      const updateTimer = () => {
        const now = Date.now()
        const remaining = Math.max(0, Math.ceil((activeVote.endTime - now) / 1000))
        setTimeRemaining(remaining)
        
        if (remaining === 0 && voteTimerRef.current) {
          clearInterval(voteTimerRef.current)
        }
      }
      
      updateTimer()
      voteTimerRef.current = setInterval(updateTimer, 100)
      
      return () => {
        if (voteTimerRef.current) {
          clearInterval(voteTimerRef.current)
        }
      }
    }
  }, [activeVote])

  useEffect(() => {
    initializeBattle()
  }, [])

  // Reconnect WebSocket when entering battle phase (after delegation)
  useEffect(() => {
    if (battlePhase === 'battle' && battleId && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('🔄 Battle phase changed to "battle" - ensuring WebSocket is registered...')
      wsRef.current.send(JSON.stringify({
        type: 'WAR_BATTLE_CONNECT',
        payload: { battleId, playerAddress: userAddress }
      }))
    }
  }, [battlePhase, battleId, userAddress])

  const initializeBattle = async () => {
    try {
      // Check if we have room data for multiplayer
      if (!currentRoom || !currentRoom.players || currentRoom.players.length < 2) {
        console.warn('⚠️ No multiplayer room data found!')
        console.warn('⚠️ This will create a SINGLE PLAYER battle with MOCK data')
        console.warn('⚠️ currentRoom:', currentRoom)
      }
      
      let teamLeaderAddress = userAddress
      let isHost = true
      
      if (currentRoom && currentRoom.players && currentRoom.players.length > 1) {
        const hostPlayer = currentRoom.players.find((p: any) => p.isHost)
        if (hostPlayer) {
          teamLeaderAddress = hostPlayer.address
          isHost = hostPlayer.address.toLowerCase() === userAddress.toLowerCase()
        }
      }

      console.log('🎮 Initializing battle...')
      console.log('👤 Current user:', userAddress)
      console.log('👑 Team leader will be:', teamLeaderAddress)
      console.log('🎯 Is this user the host?', isHost)
      console.log('🏠 Current room:', currentRoom)
      console.log('👥 Room players:', currentRoom?.players)
      console.log('🎭 Character selections:', characterSelections)

      let data
      
      // CRITICAL FIX: Only HOST creates the battle, teammates join existing battle
      if (isHost) {
        console.log('👑 HOST: Creating new battle...')
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/war-battle/initialize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamLeaderAddress,
            selectedCharacter,
            currentRoom,
            characterSelections
          })
        })
        data = await response.json()
        console.log('✅ HOST: Battle created:', data.battleId)
      } else {
        console.log('👥 TEAMMATE: Waiting for host to create battle...')
        // Wait a bit for host to create battle
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Try to find the battle by polling
        let attempts = 0
        while (attempts < 10) {
          try {
            // Get all battles and find the one with our team leader
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/war-battle/find`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ teamLeaderAddress })
            })
            
            if (response.ok) {
              data = await response.json()
              if (data.battleId) {
                console.log('✅ TEAMMATE: Found battle:', data.battleId)
                break
              }
            }
          } catch (err) {
            console.log('⏳ TEAMMATE: Battle not ready yet, retrying...')
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000))
          attempts++
        }
        
        if (!data || !data.battleId) {
          console.error('❌ TEAMMATE: Could not find battle after 10 attempts')
          // Fallback: create own battle (old behavior)
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/war-battle/initialize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teamLeaderAddress,
              selectedCharacter,
              currentRoom,
              characterSelections
            })
          })
          data = await response.json()
        }
      }
      
      console.log('📦 Battle data received:', data)
      
      setBattleId(data.battleId)
      setEnemies(data.battle.enemies)
      setTransactions(data.battle.transactions)
      
      // SYNC WITH BLOCKCHAIN: Check real delegation amounts
      console.log('🔗 Syncing team member data with blockchain...')
      const { verifyTeamDelegations } = await import('@/lib/warBattleContract')
      
      try {
        const blockchainDelegations = await verifyTeamDelegations(teamLeaderAddress, data.battle.teamMembers)
        
        // Update team members with REAL blockchain data
        const syncedTeamMembers = data.battle.teamMembers.map((member: TeamMember) => {
          if (member.isTeamLeader) return member
          
          const blockchainData = blockchainDelegations.find(d => 
            d.address.toLowerCase() === member.address.toLowerCase()
          )
          
          if (blockchainData && blockchainData.active) {
            console.log(`✅ Synced ${member.address.substring(0, 8)}... with blockchain: ${blockchainData.available} MNT`)
            return {
              ...member,
              delegatedAmount: parseFloat(blockchainData.available),
              isActive: true,
              lastAction: `${member.characterName} - Delegation active (${blockchainData.available} MNT)`
            }
          }
          
          return member
        })
        
        setTeamMembers(syncedTeamMembers)
        console.log('✅ Team members synced with blockchain')
      } catch (err) {
        console.error('❌ Failed to sync with blockchain, using backend data:', err)
        setTeamMembers(data.battle.teamMembers)
      }
      
      // Check if user needs to delegate
      const userMember = data.battle.teamMembers.find((m: TeamMember) => 
        m.address.toLowerCase() === userAddress?.toLowerCase()
      )
      
      console.log('🎮 Battle initialized for user:', userAddress)
      console.log('👤 User member data:', userMember)
      console.log('💰 Delegated amount:', userMember?.delegatedAmount)
      
      // NO DELEGATION NEEDED - Go straight to battle!
      console.log('✅ User ready for battle (no delegation required)')
      setBattlePhase('battle')

      connectWebSocket(data.battleId)
    } catch (error) {
      console.error('Failed to initialize battle:', error)
    }
  }

  const connectWebSocket = (battleId: string) => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081')
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      ws.send(JSON.stringify({
        type: 'WAR_BATTLE_CONNECT',
        payload: { battleId, playerAddress: userAddress }
      }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleWebSocketMessage(data)
    }

    ws.onclose = () => setIsConnected(false)
  }

  const handleWebSocketMessage = (data: any) => {
    console.log('📨 WAR BATTLE WebSocket message received:', data.type, data)
    
    switch (data.type) {
      case 'WAR_BATTLE_CONNECTED':
        console.log('✅ Battle connected, updating state...')
        setTeamMembers(data.battle.teamMembers)
        setEnemies(data.battle.enemies)
        setTransactions(data.battle.transactions)
        setCurrentRound(data.battle.round || 1)
        console.log('✅ State updated from WAR_BATTLE_CONNECTED')
        break
      case 'WAR_WEAPON_LAUNCHED':
        console.log('💥 Weapon launched! Updating all players...')
        console.log('  Team members:', data.teamMembers)
        console.log('  Enemies:', data.enemies)
        console.log('  Transaction:', data.transaction)
        console.log('  Round:', data.round)
        
        setTransactionPending(false) // Stop slow arrow animation
        
        // Use functional updates to avoid stale state
        setTeamMembers(() => {
          console.log('  ✅ Updating team members with fresh data')
          return [...data.teamMembers]
        })
        setEnemies(() => {
          console.log('  ✅ Updating enemies with fresh data')
          return [...data.enemies]
        })
        setTransactions(prev => {
          console.log('  ✅ Adding transaction to history')
          return [data.transaction, ...prev.slice(0, 4)]
        })
        
        if (data.round) {
          setCurrentRound(data.round)
        }
        
        setAttackAnimation(data.weapon.name)
        setTimeout(() => setAttackAnimation(null), 2000)
        
        // Check if round complete (all enemies destroyed)
        const allDestroyed = data.enemies.every((e: Enemy) => e.isDestroyed)
        if (allDestroyed && data.phase !== 'victory') {
          console.log('🎉 Round complete! Waiting for next round...')
        }
        
        if (data.phase === 'victory') {
          setBattlePhase('victory')
        }
        
        // Clear active vote after weapon launches
        setActiveVote(null)
        console.log('✅ All players should see the update now!')
        break
      case 'WAR_ROUND_COMPLETE':
        console.log('🎊 Round complete! Starting next round...')
        setShowRoundTransition(true)
        setCurrentRound(data.round)
        setTimeout(() => {
          setEnemies(data.enemies)
          setShowRoundTransition(false)
        }, 3000)
        break
      case 'WAR_VOTE_STARTED':
        console.log('🗳️ Vote started for weapon:', data.vote.weaponName)
        setActiveVote(data.vote)
        break
      case 'WAR_VOTE_UPDATED':
        console.log('🗳️ Vote updated:', data.vote)
        setActiveVote(data.vote)
        break
      case 'WAR_VOTE_PASSED':
        console.log('✅ Vote passed! Launching weapon:', data.vote.weaponName)
        setActiveVote({ ...data.vote, status: 'passed' })
        setTransactionPending(true) // Show slow arrow animation
        setTimeout(() => setActiveVote(null), 1000)
        break
      case 'WAR_VOTE_FAILED':
        console.log('❌ Vote failed for weapon:', data.vote.weaponName)
        setActiveVote({ ...data.vote, status: 'failed' })
        setTimeout(() => setActiveVote(null), 1000)
        break
      case 'WAR_DELEGATION_UPDATED':
        console.log('🔐 Delegation updated! Refreshing team members...')
        console.log('  Player:', data.player)
        console.log('  Amount:', data.amount)
        console.log('  Team members:', data.teamMembers)
        
        // Use functional update
        setTeamMembers(() => {
          console.log('  ✅ Updating team members with delegation data')
          return [...data.teamMembers]
        })
        setTransactions(prev => [data.transaction, ...prev.slice(0, 4)])
        console.log(`✅ ${data.player} delegation updated: ${data.amount} MNT`)
        console.log('✅ Team pool should auto-refresh now!')
        break
      case 'WAR_PERMISSION_REVOKED':
      case 'WAR_PERMISSION_GRANTED':
        console.log('🔄 Permission changed, updating team members...')
        setTeamMembers(data.teamMembers)
        setTransactions(prev => [data.transaction, ...prev.slice(0, 4)])
        console.log('✅ Permission update complete')
        break
      case 'WAR_ERROR':
        console.error('❌ War battle error:', data.message)
        alert(`Error: ${data.message}`)
        break
      default:
        console.warn('⚠️ Unknown message type:', data.type)
    }
  }

  const proposeWeapon = async (weaponId: string) => {
    const weapon = WEAPONS.find(w => w.id === weaponId)
    if (!weapon || !wsRef.current || !currentMember) return

    // SOLO MODE: Skip voting, directly launch weapon
    if (isSoloMode) {
      console.log('⚡ SOLO MODE: Launching weapon directly without voting:', weapon.name)
      
      // Show charging animation
      setTransactionPending(true)
      
      // Send direct launch command with proper format
      wsRef.current.send(JSON.stringify({
        type: 'WAR_LAUNCH_WEAPON',
        payload: {
          battleId,
          weapon: {
            id: weapon.id,
            name: weapon.name,
            cost: weapon.cost,
            damage: weapon.damage
          },
          teamLeaderAddress: userAddress,
          targetEnemies: [] // Empty means all enemies
        }
      }))
      return
    }

    // MULTIPLAYER MODE: Start voting
    // Check if there's already an active vote
    if (activeVote && activeVote.status === 'active') {
      alert('⚠️ There is already an active vote! Wait for it to finish.')
      return
    }

    console.log('🗳️ Proposing weapon vote:', weapon.name)
    
    // Send vote proposal to backend
    wsRef.current.send(JSON.stringify({
      type: 'WAR_PROPOSE_WEAPON',
      payload: {
        battleId,
        weaponId: weapon.id,
        weaponName: weapon.name,
        weaponCost: weapon.cost,
        proposedBy: userAddress,
        proposedByName: currentMember.displayName
      }
    }))
  }

  const voteForWeapon = async (approve: boolean) => {
    if (!wsRef.current || !activeVote || hasVoted) return

    console.log(`🗳️ Voting ${approve ? 'YES' : 'NO'} for weapon:`, activeVote.weaponName)
    
    wsRef.current.send(JSON.stringify({
      type: 'WAR_VOTE',
      payload: {
        battleId,
        voteId: `${activeVote.weaponId}_${activeVote.startTime}`,
        voterAddress: userAddress,
        approve
      }
    }))
  }

  const delegatePermission = async (txHash: string, amount: number) => {
    console.log('✅ Delegation completed with tx:', txHash)
    console.log('💰 Amount delegated:', amount, 'MNT')
    
    // Update UI
    setShowDelegatePrompt(false)
    setBattlePhase('battle')
    
    // Update team member state locally with actual amount
    setTeamMembers(prev => prev.map(m => 
      m.address.toLowerCase() === userAddress?.toLowerCase()
        ? { ...m, delegatedAmount: amount, isActive: true }
        : m
    ))
    
    // CRITICAL: Re-register WebSocket connection with battle AFTER delegation
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('🔗 Re-registering WebSocket connection with battle after delegation...')
      
      // First, register the WebSocket connection
      wsRef.current.send(JSON.stringify({
        type: 'WAR_BATTLE_CONNECT',
        payload: { battleId, playerAddress: userAddress }
      }))
      
      // Then notify about delegation completion
      setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'WAR_DELEGATION_COMPLETE',
            payload: {
              battleId,
              playerAddress: userAddress,
              amount: amount,
              transactionHash: txHash
            }
          }))
        }
      }, 100) // Small delay to ensure connection is registered first
    }
  }

  const revokePermission = async () => {
    if (isLeader) return
    
    try {
      // Import the real blockchain function
      const { revokeFromLeader } = await import('@/lib/warBattleContract')
      
      // Find team leader address
      const leader = teamMembers.find(m => m.isTeamLeader)
      if (!leader) {
        alert('Team leader not found')
        return
      }
      
      console.log('🚨 Executing REAL revoke transaction...')
      
      // Execute REAL blockchain transaction
      const result = await revokeFromLeader(leader.address)
      
      if (!result.success) {
        alert(`Revoke failed: ${result.error}`)
        return
      }
      
      console.log('✅ REAL revoke successful!')
      console.log('📝 Tx Hash:', result.txHash)
      
      // Send to backend via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'WAR_REVOKE_PERMISSION',
          payload: { 
            battleId, 
            playerAddress: userAddress,
            transactionHash: result.txHash
          }
        }))
      }
      
    } catch (error: any) {
      console.error('❌ Revoke failed:', error)
      alert(`Failed to revoke: ${error.message}`)
    }
  }

  if (battlePhase === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⚔️</div>
          <div className="text-2xl text-white font-bold">Initializing Battle...</div>
        </div>
      </div>
    )
  }

  console.log('🎨 Rendering ImprovedWarBattle')
  console.log('  battlePhase:', battlePhase)
  console.log('  showDelegatePrompt:', showDelegatePrompt)
  console.log('  isLeader:', isLeader)
  console.log('  currentMember:', currentMember)
  console.log('  Should show DelegationPage?', showDelegatePrompt && battlePhase === 'delegation')

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-black to-purple-950 text-white">
      {/* Round Transition Overlay */}
      <AnimatePresence>
        {showRoundTransition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-9xl mb-6"
              >
                🎉
              </motion.div>
              <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent"
              >
                ROUND {currentRound - 1} COMPLETE!
              </motion.h1>
              <motion.p
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-3xl text-gray-300 mb-8"
              >
                Preparing Round {currentRound}...
              </motion.p>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="text-6xl"
              >
                ⚔️
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-black/80 backdrop-blur-sm border-b-2 border-red-500 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            onClick={onBackToLobby}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Exit Battle</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-500 flex items-center justify-center space-x-3">
              <span>⚔️</span>
              <span>WAR BATTLE</span>
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"
              >
                ROUND {currentRound}
              </motion.span>
            </h1>
            <div className="text-sm text-gray-400">
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-400">Players</div>
            <div className="text-2xl font-bold text-purple-400">{teamMembers.length}</div>
          </div>
        </div>
      </div>

      {/* Main Battle Area */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Team & Weapons */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enemies */}
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-red-500 relative overflow-hidden">
              {/* Transaction Pending - Epic Charging Animation */}
              {transactionPending && (
                <>
                  {/* Pulsing Background */}
                  <motion.div
                    animate={{ 
                      opacity: [0.1, 0.3, 0.1],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 z-10"
                  />
                  
                  {/* Energy Particles */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        x: Math.random() * 100 - 50,
                        y: Math.random() * 100 - 50,
                        opacity: 0 
                      }}
                      animate={{ 
                        x: [
                          Math.random() * 100 - 50,
                          Math.random() * 200 - 100,
                          Math.random() * 100 - 50
                        ],
                        y: [
                          Math.random() * 100 - 50,
                          Math.random() * 200 - 100,
                          Math.random() * 100 - 50
                        ],
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0]
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 3,
                        delay: i * 0.3,
                        ease: "easeInOut"
                      }}
                      className="absolute top-1/2 left-1/2 w-4 h-4 bg-yellow-400 rounded-full blur-sm z-15"
                      style={{ 
                        boxShadow: '0 0 20px rgba(250, 204, 21, 0.8)'
                      }}
                    />
                  ))}
                  
                  {/* Center Charging Icon */}
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      rotate: { repeat: Infinity, duration: 2, ease: "linear" },
                      scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                    }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
                  >
                    <div className="relative">
                      <div className="text-8xl">⚡</div>
                      <motion.div
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 0, 0.5]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 1.5 
                        }}
                        className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl"
                      />
                    </div>
                  </motion.div>
                  
                  {/* Status Text */}
                  <motion.div
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20"
                  >
                    <div className="bg-black/80 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-yellow-400">
                      <div className="flex items-center space-x-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full"
                        />
                        <span className="text-yellow-400 font-bold text-lg">
                          Charging Weapon...
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
              
              {/* Attack Arrow Animation */}
              {attackAnimation && (
                <motion.div
                  initial={{ opacity: 0, x: -100, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 1, 0], x: [-100, 0, 50, 100], scale: [0.5, 1.2, 1, 0.5] }}
                  transition={{ duration: 1.5 }}
                  className="absolute top-1/2 left-0 right-0 z-20 pointer-events-none"
                >
                  <div className="flex items-center justify-center">
                    <div className="text-6xl">🔥</div>
                    <motion.div
                      animate={{ x: [0, 20, 0] }}
                      transition={{ repeat: Infinity, duration: 0.3 }}
                      className="text-4xl text-yellow-400"
                    >
                      ➤➤➤
                    </motion.div>
                    <div className="text-6xl">💥</div>
                  </div>
                </motion.div>
              )}

              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Skull className="w-6 h-6 mr-2 text-red-500" />
                Enemies from the Upside Down
                <div className="ml-auto text-sm text-gray-400">
                  {enemies.filter(e => !e.isDestroyed).length}/{enemies.length} Alive
                </div>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {enemies.map((enemy) => (
                  <motion.div
                    key={`${enemy.id}-${enemy.health}-${enemy.isDestroyed}`}
                    animate={attackAnimation ? { 
                      scale: [1, 0.9, 1.1, 0.95, 1], 
                      rotate: [0, -5, 5, -3, 0],
                      x: [0, -10, 10, -5, 0]
                    } : {}}
                    transition={{ duration: 0.5 }}
                    className={`relative bg-gradient-to-br from-red-900/50 to-black rounded-xl p-4 border-2 ${
                      enemy.isDestroyed ? 'border-gray-600 opacity-50' : 'border-red-500 shadow-lg shadow-red-500/20'
                    }`}
                  >
                    {enemy.isDestroyed && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-xl z-10">
                        <div className="text-center">
                          <div className="text-6xl mb-2">☠️</div>
                          <div className="text-red-400 font-bold">DEFEATED</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Damage indicator */}
                    {attackAnimation && !enemy.isDestroyed && (
                      <motion.div
                        initial={{ opacity: 0, y: 0, scale: 0.5 }}
                        animate={{ opacity: [0, 1, 1, 0], y: [0, -30, -60, -90], scale: [0.5, 1.2, 1, 0.8] }}
                        transition={{ duration: 1.5 }}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                      >
                        <div className="text-4xl font-bold text-red-500 drop-shadow-lg">
                          -{WEAPONS.find(w => w.name === attackAnimation)?.damage || 0}
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="relative w-24 h-24 mx-auto mb-3">
                      <Image
                        src={enemy.image}
                        alt={enemy.type}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    
                    <h3 className="text-center font-bold text-lg mb-2 capitalize">{enemy.type}</h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">HP:</span>
                        <span className={`font-bold ${enemy.health < enemy.maxHealth * 0.3 ? 'text-red-400' : 'text-white'}`}>
                          {enemy.health}/{enemy.maxHealth}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden border border-gray-600">
                        <motion.div
                          initial={{ width: '100%' }}
                          animate={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                          transition={{ duration: 0.5 }}
                          className={`h-full ${
                            enemy.health > enemy.maxHealth * 0.6 ? 'bg-gradient-to-r from-green-600 to-green-400' :
                            enemy.health > enemy.maxHealth * 0.3 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
                            'bg-gradient-to-r from-red-600 to-red-400'
                          }`}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">DMG:</span>
                        <span className="text-red-400 font-bold flex items-center">
                          <span className="mr-1">⚔️</span>
                          {enemy.damage}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Voting Banner - Shows when vote is active */}
            <AnimatePresence>
              {activeVote && (
                <motion.div
                  initial={{ opacity: 0, y: -50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -50, scale: 0.9 }}
                  className={`relative bg-gradient-to-r ${
                    activeVote.status === 'passed' ? 'from-green-900 to-emerald-900' :
                    activeVote.status === 'failed' ? 'from-red-900 to-orange-900' :
                    'from-purple-900 via-blue-900 to-purple-900'
                  } backdrop-blur-sm rounded-2xl p-6 border-4 ${
                    activeVote.status === 'passed' ? 'border-green-500 shadow-lg shadow-green-500/50' :
                    activeVote.status === 'failed' ? 'border-red-500 shadow-lg shadow-red-500/50' :
                    'border-yellow-500 shadow-lg shadow-yellow-500/50 animate-pulse'
                  } overflow-hidden`}
                >
                  {/* Animated background arrows */}
                  {activeVote.status === 'active' && (
                    <>
                      <motion.div
                        animate={{ x: [-100, 100], opacity: [0, 0.3, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="absolute top-0 left-0 text-6xl text-yellow-400/20"
                      >
                        ➤➤➤
                      </motion.div>
                      <motion.div
                        animate={{ x: [100, -100], opacity: [0, 0.3, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear", delay: 1 }}
                        className="absolute bottom-0 right-0 text-6xl text-yellow-400/20"
                      >
                        ➤➤➤
                      </motion.div>
                    </>
                  )}

                  <div className="relative z-10">
                    <div className="text-center mb-4">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-6xl mb-2"
                      >
                        {activeVote.status === 'passed' ? '✅' :
                         activeVote.status === 'failed' ? '❌' :
                         '🗳️'}
                      </motion.div>
                      <h2 className="text-3xl font-bold drop-shadow-lg">
                        {activeVote.status === 'passed' ? '✅ VOTE PASSED!' :
                         activeVote.status === 'failed' ? '❌ VOTE FAILED' :
                         '⚡ WEAPON VOTE IN PROGRESS ⚡'}
                      </h2>
                      <div className="mt-3 flex items-center justify-center space-x-2">
                        <span className="text-gray-300">{activeVote.proposedByName} proposes:</span>
                        <motion.span 
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="font-bold text-yellow-400 text-xl"
                        >
                          {activeVote.weaponName}
                        </motion.span>
                      </div>
                    </div>

                    {activeVote.status === 'active' && (
                      <>
                        <div className="flex justify-center items-center space-x-8 mb-6">
                          {/* Timer with circular progress */}
                          <div className="relative">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                              className="absolute inset-0 border-4 border-yellow-400/30 rounded-full"
                            />
                            <div className="relative bg-black/50 rounded-full p-6 border-4 border-yellow-500">
                              <div className="text-center">
                                <motion.div 
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                  className="text-5xl font-bold text-yellow-400"
                                >
                                  {timeRemaining}
                                </motion.div>
                                <div className="text-xs text-gray-400 mt-1">seconds</div>
                              </div>
                            </div>
                          </div>

                          {/* Arrow pointing to votes */}
                          <motion.div
                            animate={{ x: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="text-6xl text-yellow-400"
                          >
                            ➤
                          </motion.div>

                          {/* Vote counter */}
                          <div className="relative">
                            <div className="relative bg-black/50 rounded-full p-6 border-4 border-green-500">
                              <div className="text-center">
                                <div className="text-5xl font-bold text-green-400">
                                  {activeVote.votes.length}<span className="text-gray-500">/{votesNeeded}</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">votes</div>
                              </div>
                            </div>
                            {/* Checkmarks for each vote */}
                            {activeVote.votes.map((_, index) => (
                              <motion.div
                                key={index}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="absolute text-2xl"
                                style={{
                                  top: `${-20 + index * 15}px`,
                                  right: `${-30 + index * 10}px`
                                }}
                              >
                                ✅
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Progress bar with arrows */}
                        <div className="relative mb-6">
                          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden border-2 border-gray-600">
                            <motion.div
                              animate={{ width: `${(activeVote.votes.length / votesNeeded) * 100}%` }}
                              transition={{ duration: 0.5 }}
                              className="h-full bg-gradient-to-r from-green-600 via-emerald-500 to-green-400 relative"
                            >
                              <motion.div
                                animate={{ x: [-20, 0] }}
                                transition={{ repeat: Infinity, duration: 0.5 }}
                                className="absolute right-0 top-0 bottom-0 flex items-center text-white font-bold"
                              >
                                ➤
                              </motion.div>
                            </motion.div>
                          </div>
                          <div className="text-center text-xs text-gray-400 mt-1">
                            {Math.round((activeVote.votes.length / votesNeeded) * 100)}% Complete
                          </div>
                        </div>

                        {!hasVoted ? (
                          <div className="flex space-x-4">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => voteForWeapon(true)}
                              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-5 px-6 rounded-xl transition-all shadow-lg shadow-green-500/50 border-2 border-green-400 flex items-center justify-center space-x-3"
                            >
                              <span className="text-3xl">✅</span>
                              <div className="text-left">
                                <div className="text-xl">VOTE YES</div>
                                <div className="text-xs opacity-75">Support this weapon</div>
                              </div>
                              <motion.span
                                animate={{ x: [0, 5, 0] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                className="text-2xl"
                              >
                                ➤
                              </motion.span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => voteForWeapon(false)}
                              className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-5 px-6 rounded-xl transition-all shadow-lg shadow-red-500/50 border-2 border-red-400 flex items-center justify-center space-x-3"
                            >
                              <span className="text-3xl">❌</span>
                              <div className="text-left">
                                <div className="text-xl">VOTE NO</div>
                                <div className="text-xs opacity-75">Reject this weapon</div>
                              </div>
                              <motion.span
                                animate={{ x: [0, 5, 0] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                className="text-2xl"
                              >
                                ➤
                              </motion.span>
                            </motion.button>
                          </div>
                        ) : (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-blue-500/20 border-4 border-blue-500 rounded-xl p-6 text-center"
                          >
                            <motion.div 
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="text-5xl mb-3"
                            >
                              ✅
                            </motion.div>
                            <div className="text-xl font-bold mb-2">You voted!</div>
                            <div className="text-gray-300">Waiting for other players...</div>
                            <motion.div
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="text-4xl mt-3"
                            >
                              ⏳
                            </motion.div>
                          </motion.div>
                        )}

                        <div className="mt-4 text-center text-sm text-gray-400 bg-black/30 rounded-lg p-3">
                          <div className="font-bold mb-1">👥 Voters:</div>
                          <div className="flex justify-center space-x-2">
                            {activeVote.votes.map((v, i) => (
                              <motion.span
                                key={v}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-green-500/20 border border-green-500 rounded-full px-3 py-1 text-green-400"
                              >
                                {v.substring(0, 6)}...
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {activeVote.status === 'passed' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-center"
                      >
                        <div className="text-green-400 font-bold text-2xl mb-3">
                          🚀 Launching weapon now!
                        </div>
                        <motion.div
                          animate={{ x: [-50, 50] }}
                          transition={{ repeat: Infinity, duration: 0.5 }}
                          className="text-6xl"
                        >
                          ➤➤➤ 💥
                        </motion.div>
                      </motion.div>
                    )}

                    {activeVote.status === 'failed' && (
                      <div className="text-center text-red-400 font-bold text-xl">
                        Not enough votes. Try another weapon!
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Weapons Arsenal - Everyone can propose */}
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-500">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold flex items-center">
                  <Zap className="w-6 h-6 mr-2 text-yellow-500" />
                  Team Arsenal (Vote to Use)
                </h2>
                <div className="text-sm text-gray-400">
                  {activeVote ? '🗳️ Vote Active' : '✅ Ready'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WEAPONS.map((weapon) => {
                  const isVoting = activeVote && activeVote.status === 'active'
                  
                  return (
                    <motion.button
                      key={weapon.id}
                      whileHover={!isVoting ? { scale: 1.05, y: -5 } : {}}
                      whileTap={!isVoting ? { scale: 0.95 } : {}}
                      onClick={() => !isVoting && proposeWeapon(weapon.id)}
                      disabled={isVoting}
                      className={`relative p-5 rounded-xl border-2 transition-all ${
                        !isVoting
                          ? 'bg-gradient-to-br from-red-900/50 via-purple-900/50 to-red-900/50 border-yellow-500 hover:border-yellow-300 cursor-pointer shadow-lg hover:shadow-yellow-500/50'
                          : 'bg-gray-900/50 border-gray-600 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {/* Animated glow effect for available weapons */}
                      {!isVoting && (
                        <motion.div
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl"
                        />
                      )}

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <motion.div 
                            animate={!isVoting ? { rotate: [0, 10, -10, 0] } : {}}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="text-5xl"
                          >
                            {weapon.icon}
                          </motion.div>
                          <div className="text-right">
                            <div className="text-yellow-400 font-bold text-lg flex items-center justify-end">
                              <span className="mr-1">💰</span>
                              {weapon.cost} MNT
                            </div>
                            <div className="text-red-400 text-sm font-bold flex items-center justify-end">
                              <span className="mr-1">⚔️</span>
                              {weapon.damage} DMG
                            </div>
                          </div>
                        </div>
                        
                        <div className="font-bold text-left text-lg mb-2">{weapon.name}</div>
                        
                        {/* Action indicator */}
                        {!isVoting && (
                          <div className="flex items-center justify-center space-x-2 text-sm text-yellow-400 bg-black/30 rounded-lg py-2">
                            <span>Click to propose</span>
                            <motion.span
                              animate={{ x: [0, 5, 0] }}
                              transition={{ repeat: Infinity, duration: 0.8 }}
                            >
                              ➤
                            </motion.span>
                          </div>
                        )}
                      </div>

                      {isVoting && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-xl backdrop-blur-sm">
                          <div className="text-center">
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                              className="text-3xl mb-2"
                            >
                              🗳️
                            </motion.div>
                            <span className="text-yellow-400 font-bold text-sm">Vote in Progress</span>
                          </div>
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              <div className="mt-4 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-3 text-sm text-gray-300">
                <div className="font-bold text-blue-400 mb-1">🗳️ Democratic Voting System:</div>
                <ul className="space-y-1 text-xs">
                  <li>• Anyone can propose a weapon</li>
                  <li>• 10-second voting window opens</li>
                  <li>• **Proposer must also vote** (no auto-vote)</li>
                  <li>• Need {votesNeeded}/{totalPlayers} votes to pass (min 2 votes)</li>
                  <li>• Weapon launches if vote passes</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right: Team Status & Transactions */}
          <div className="space-y-6">
            {/* Team Status - Only show in multiplayer */}
            {!isSoloMode && (
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-500">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-500" />
                  Team Status
                </h2>
                
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div
                      key={`${member.address}-${member.delegatedAmount}-${member.spentAmount}`}
                      className={`bg-black/50 rounded-lg p-3 border-2 ${
                        member.isTeamLeader ? 'border-yellow-500' : 'border-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="relative w-10 h-10">
                          <Image
                            src={member.characterImage}
                            alt={member.characterName}
                            fill
                            className="object-cover rounded-full"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{member.characterName}</div>
                          <div className="text-xs text-gray-400">{member.displayName}</div>
                        </div>
                        {member.isTeamLeader && (
                          <div className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                            LEADER
                          </div>
                        )}
                      </div>
                      
                      {!member.isTeamLeader && (
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Delegated:</span>
                            <span className="text-green-400">{member.delegatedAmount.toFixed(3)} MNT</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Remaining:</span>
                            <span className="text-yellow-400">
                              {(member.delegatedAmount - member.spentAmount).toFixed(3)} MNT
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction Feed */}
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-green-500">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Flame className="w-5 h-5 mr-2 text-green-500" />
                Battle Log
              </h2>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactions.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    No actions yet. Leader, launch your first attack!
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-black/50 rounded-lg p-3 border border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-sm">{tx.weapon}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      
                      {tx.spentFrom.length > 0 && (
                        <div className="text-xs space-y-1 mb-2">
                          {tx.spentFrom.map((spend, idx) => (
                            <div key={idx} className="flex justify-between text-gray-400">
                              <span>{spend.address.substring(0, 8)}...</span>
                              <span className="text-red-400">-{spend.amount.toFixed(3)} WMANTLE</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {tx.txHash && (
                        <a
                          href={`https://explorer.sepolia.mantle.xyz/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                        >
                          <span>📜</span>
                          <span className="underline">
                            {tx.txHash.substring(0, 10)}...{tx.txHash.substring(tx.txHash.length - 8)}
                          </span>
                          <span>↗</span>
                        </a>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attack Animation Overlay */}
      <AnimatePresence>
        {attackAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1], rotate: [0, 360] }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-9xl"
            >
              💥
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory/Defeat Overlay */}
      <AnimatePresence>
        {(battlePhase === 'victory' || battlePhase === 'defeat') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center"
            >
              <div className="text-9xl mb-6">
                {battlePhase === 'victory' ? '🎉' : '💀'}
              </div>
              <h1 className="text-6xl font-bold mb-4">
                {battlePhase === 'victory' ? 'VICTORY!' : 'DEFEAT!'}
              </h1>
              <p className="text-2xl text-gray-300 mb-8">
                {battlePhase === 'victory' 
                  ? 'All enemies have been destroyed!' 
                  : 'Your team was overwhelmed...'}
              </p>
              <button
                onClick={onBackToLobby}
                className="bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white font-bold py-4 px-8 rounded-xl text-xl"
              >
                Back to Lobby
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
