'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Zap, Heart, Shield, Sword, Target, Bomb, Rocket, Radio, AlertTriangle, Crown, Users } from 'lucide-react'
import { useAccount } from 'wagmi'
import Image from 'next/image'

interface WarBattleArenaProps {
  userAddress: string
  selectedCharacter?: Character | null
  currentRoom?: any // Room data for multiplayer battles
  characterSelections?: Record<string, Character> // All player character selections for multiplayer
  onBackToLobby: () => void
}

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

interface Enemy {
  id: string
  type: 'tank' | 'helicopter' | 'fortress' | 'bomber'
  health: number
  maxHealth: number
  damage: number
  position: { x: number; y: number }
  isDestroyed: boolean
  image?: string
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

interface Weapon {
  id: string
  name: string
  cost: number
  damage: number
  icon: string
  description: string
  cooldown: number
}

interface Transaction {
  id: string
  weapon: string
  cost: number
  spentFrom: { address: string; amount: number }[]
  timestamp: string
  success: boolean
}

const WEAPONS: Weapon[] = [
  {
    id: 'nuke',
    name: 'Eleven\'s Psychic Blast',
    cost: 0.1,
    damage: 1000,
    icon: '🧠',
    description: 'Eleven channels all her psychic power - destroys everything',
    cooldown: 60
  },
  {
    id: 'cluster',
    name: 'Molotov Cocktails',
    cost: 0.05,
    damage: 400,
    icon: '🔥',
    description: 'Steve\'s signature move - multiple fire explosions',
    cooldown: 30
  },
  {
    id: 'missile',
    name: 'Dustin\'s Cerebro Strike',
    cost: 0.03,
    damage: 250,
    icon: '📡',
    description: 'Precision radio-guided attacks on selected targets',
    cooldown: 20
  },
  {
    id: 'emp',
    name: 'Mind Flayer Disruption',
    cost: 0.02,
    damage: 150,
    icon: '⚡',
    description: 'Disrupts Upside Down connections and electronics',
    cooldown: 15
  },
  {
    id: 'shield',
    name: 'Hawkins Lab Barrier',
    cost: 0.04,
    damage: 0,
    icon: '🛡️',
    description: 'Government-grade protection shield for the team',
    cooldown: 25
  },
  {
    id: 'radar',
    name: 'Will\'s True Sight',
    cost: 0.01,
    damage: 0,
    icon: '👁️',
    description: 'Will\'s connection reveals hidden enemies and weak points',
    cooldown: 10
  }
]

const PERSONAL_ACTIONS = [
  { id: 'airstrike', name: 'Hopper\'s Backup', cost: 0.02, icon: '🚁' },
  { id: 'medkit', name: 'Joyce\'s First Aid', cost: 0.01, icon: '🏥' },
  { id: 'boost', name: 'Eggo Power-Up', cost: 0.005, icon: '🧇' }
]

export function WarBattleArena({ userAddress, selectedCharacter, currentRoom, characterSelections, onBackToLobby }: WarBattleArenaProps) {
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [round, setRound] = useState(1)
  const [battlePhase, setBattlePhase] = useState<'setup' | 'battle' | 'victory' | 'defeat'>('setup')
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [weaponCooldowns, setWeaponCooldowns] = useState<Record<string, number>>({})
  const [teamShield, setTeamShield] = useState(false)
  const [radarActive, setRadarActive] = useState(false)
  const [personalAction, setPersonalAction] = useState<string>('')
  const [showPermissionPanel, setShowPermissionPanel] = useState(false)
  const [battleId, setBattleId] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  
  const wsRef = useRef<WebSocket | null>(null)
  const battleLogsRef = useRef<HTMLDivElement>(null)

  // Initialize battle and connect to backend
  useEffect(() => {
    initializeBattle()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [userAddress])

  const initializeBattle = async () => {
    try {
      // Determine who the team leader should be
      // In multiplayer, the host is the team leader
      let teamLeaderAddress = userAddress;
      let isMultiplayer = false;
      
      if (currentRoom && currentRoom.players && currentRoom.players.length > 1) {
        isMultiplayer = true;
        // Find the host player
        const hostPlayer = currentRoom.players.find((p: any) => p.isHost);
        if (hostPlayer) {
          teamLeaderAddress = hostPlayer.address;
          console.log('🎮 Multiplayer battle - Host is team leader:', teamLeaderAddress);
        }
      }
      
      console.log('🎮 Initializing battle with team leader:', teamLeaderAddress);
      console.log('🎮 Current user:', userAddress);
      console.log('🎮 Is current user the leader?', teamLeaderAddress.toLowerCase() === userAddress?.toLowerCase());
      
      // Initialize war battle on backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/war-battle/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamLeaderAddress: teamLeaderAddress, // Use host as team leader
          selectedCharacter: selectedCharacter,
          currentRoom: currentRoom, // Pass room data to backend
          characterSelections: characterSelections // Pass all character selections
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to initialize battle')
      }

      const data = await response.json()
      console.log('🎭 Battle initialized:', data.battle)
      console.log('🎭 Team members:', data.battle.teamMembers)
      setBattleId(data.battleId)
      setTeamMembers(data.battle.teamMembers)
      setEnemies(data.battle.enemies)
      setTransactions(data.battle.transactions)
      setBattlePhase('battle')

      // Connect to WebSocket
      connectWebSocket(data.battleId)
      
    } catch (error) {
      console.error('Failed to initialize battle:', error)
      addTransaction('ERROR', 'Failed to initialize battle', 0, [])
    }
  }

  const connectWebSocket = (battleId: string) => {
    try {
      const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081')
      wsRef.current = ws

      ws.onopen = () => {
        console.log('🔗 Connected to war battle WebSocket')
        setIsConnected(true)
        
        // Register for battle updates
        ws.send(JSON.stringify({
          type: 'WAR_BATTLE_CONNECT',
          payload: { battleId, playerAddress: userAddress }
        }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleWebSocketMessage(data)
        } catch (error) {
          console.error('WebSocket message error:', error)
        }
      }

      ws.onclose = () => {
        console.log('📡 Disconnected from war battle WebSocket')
        setIsConnected(false)
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (battleId) {
            connectWebSocket(battleId)
          }
        }, 3000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }

  const handleWebSocketMessage = (data: any) => {
    const { type } = data

    switch (type) {
      case 'WAR_BATTLE_CONNECTED':
        console.log('✅ Connected to war battle')
        console.log('🎭 Received team members:', data.battle.teamMembers)
        setTeamMembers(data.battle.teamMembers)
        setEnemies(data.battle.enemies)
        setTransactions(data.battle.transactions)
        setBattlePhase(data.battle.phase)
        setRound(data.battle.round)
        break
      case 'WAR_WEAPON_LAUNCHED':
        setEnemies(data.enemies)
        setTeamMembers(data.teamMembers)
        setTransactions(prev => [data.transaction, ...prev.slice(0, 9)])
        if (data.phase === 'victory') {
          setBattlePhase('victory')
        }
        break
      case 'WAR_PERSONAL_ACTION':
        setTeamMembers(data.teamMembers)
        setTransactions(prev => [data.transaction, ...prev.slice(0, 9)])
        break
      case 'WAR_PERMISSION_REVOKED':
        setTeamMembers(data.teamMembers)
        setTransactions(prev => [data.transaction, ...prev.slice(0, 9)])
        break
      case 'WAR_PERMISSION_GRANTED':
        setTeamMembers(data.teamMembers)
        setTransactions(prev => [data.transaction, ...prev.slice(0, 9)])
        break
      case 'WAR_ERROR':
        addTransaction('ERROR', data.message, 0, [])
        break
    }
  }

  const addTransaction = (weapon: string, description: string, cost: number, spentFrom: { address: string; amount: number }[]) => {
    const newTransaction: Transaction = {
      id: `tx_${Date.now()}`,
      weapon,
      cost,
      spentFrom,
      timestamp: new Date().toLocaleTimeString(),
      success: true
    }
    
    setTransactions(prev => [newTransaction, ...prev.slice(0, 9)]) // Keep last 10
    
    // Auto-scroll to latest transaction
    setTimeout(() => {
      if (battleLogsRef.current) {
        battleLogsRef.current.scrollTop = 0
      }
    }, 100)
  }

  const isTeamLeader = teamMembers.find((m: any) => m.address === userAddress)?.isTeamLeader || false

  const calculateSpending = (cost: number): { address: string; amount: number }[] => {
    const activeMembers = teamMembers.filter((m: any) => !m.isTeamLeader && m.isActive && (m.delegatedAmount - m.spentAmount) > 0)
    
    if (activeMembers.length === 0) return []
    
    const perMember = cost / activeMembers.length
    return activeMembers.map(member => ({
      address: member.address,
      amount: Math.min(perMember, member.delegatedAmount - member.spentAmount)
    }))
  }

  const launchWeapon = (weapon: Weapon) => {
    if (!isTeamLeader) return
    if (weaponCooldowns[weapon.id] > 0) return
    if (!wsRef.current || !isConnected) {
      addTransaction('ERROR', 'Not connected to battle server', 0, [])
      return
    }
    
    const spending = calculateSpending(weapon.cost)
    const totalAvailable = spending.reduce((sum, s) => sum + s.amount, 0)
    
    if (totalAvailable < weapon.cost) {
      addTransaction('ERROR', `Insufficient team funds for ${weapon.name}`, weapon.cost, [])
      return
    }
    
    // Send weapon launch to backend
    wsRef.current.send(JSON.stringify({
      type: 'WAR_LAUNCH_WEAPON',
      payload: {
        battleId,
        weapon,
        teamLeaderAddress: userAddress,
        targetEnemies: selectedTarget ? [selectedTarget] : null
      }
    }))
    
    // Set cooldown
    setWeaponCooldowns(prev => ({ ...prev, [weapon.id]: weapon.cooldown }))
    
    // Clear target selection
    setSelectedTarget(null)
  }

  const executePersonalAction = (action: typeof PERSONAL_ACTIONS[0]) => {
    if (!wsRef.current || !isConnected) {
      addTransaction('ERROR', 'Not connected to battle server', 0, [])
      return
    }
    
    // Send personal action to backend
    wsRef.current.send(JSON.stringify({
      type: 'WAR_PERSONAL_ACTION',
      payload: {
        battleId,
        action,
        playerAddress: userAddress
      }
    }))
    
    setPersonalAction(`Used ${action.name}`)
    setTimeout(() => setPersonalAction(''), 3000)
  }

  const revokePermission = () => {
    if (!wsRef.current || !isConnected) {
      addTransaction('ERROR', 'Not connected to battle server', 0, [])
      return
    }
    
    // Send revoke permission to backend
    wsRef.current.send(JSON.stringify({
      type: 'WAR_REVOKE_PERMISSION',
      payload: {
        battleId,
        playerAddress: userAddress
      }
    }))
  }

  // Cooldown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setWeaponCooldowns(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(key => {
          if (updated[key] > 0) {
            updated[key] = Math.max(0, updated[key] - 1)
          }
        })
        return updated
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Check victory condition
  useEffect(() => {
    const allDestroyed = enemies.every(enemy => enemy.health <= 0)
    if (allDestroyed && enemies.length > 0 && battlePhase === 'battle') {
      setBattlePhase('victory')
      addTransaction('VICTORY', '🏆 All enemies destroyed! Mission accomplished!', 0, [])
    }
  }, [enemies, battlePhase])

  const getTotalTeamBudget = () => {
    return teamMembers
      .filter((m: any) => !m.isTeamLeader && m.isActive)
      .reduce((sum: number, m: any) => sum + (m.delegatedAmount - m.spentAmount), 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900/20 via-orange-900/20 to-black text-white">
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
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">🔥 STRANGER THINGS WAR ZONE - Round {round}</div>
              <div className="text-sm text-gray-400">Team Budget: {getTotalTeamBudget().toFixed(3)} MNT</div>
              {battleId && <div className="text-xs text-gray-500">Battle: {battleId.substring(0, 20)}...</div>}
            </div>
            
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
              isConnected ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
            </div>
            
            <button
              onClick={() => setShowPermissionPanel(!showPermissionPanel)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              🔐 Permissions
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Battle Area */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-orange-900/10">
            
            {/* Team Leader Weapon Controls */}
            {isTeamLeader && (
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-xl p-4 border border-yellow-500">
                {/* Selected Character Display */}
                {selectedCharacter && (
                  <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-yellow-500/30">
                    <div className="w-12 h-12 relative">
                      <Image
                        src={selectedCharacter.image}
                        alt={selectedCharacter.name}
                        fill
                        className="object-cover rounded-full border-2 border-yellow-500"
                        unoptimized
                      />
                      <Crown className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-yellow-400">{selectedCharacter.name}</div>
                      <div className="text-xs text-gray-400">{selectedCharacter.specialAbility.split(' - ')[0]}</div>
                    </div>
                  </div>
                )}
                
                <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center">
                  <Crown className="w-5 h-5 mr-2" />
                  {selectedCharacter?.name || 'Team Leader'}'s Arsenal
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {WEAPONS.map((weapon) => {
                    const cooldown = weaponCooldowns[weapon.id] || 0
                    const canAfford = getTotalTeamBudget() >= weapon.cost
                    
                    return (
                      <button
                        key={weapon.id}
                        onClick={() => launchWeapon(weapon)}
                        disabled={cooldown > 0 || !canAfford}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          cooldown > 0 
                            ? 'border-gray-600 bg-gray-800 text-gray-500 cursor-not-allowed'
                            : canAfford
                            ? 'border-red-500 bg-red-500/20 text-red-300 hover:bg-red-500/30'
                            : 'border-gray-600 bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                        title={weapon.description}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-lg">{weapon.icon}</span>
                          <span className="text-xs font-mono">{weapon.cost} MNT</span>
                        </div>
                        <div className="text-sm font-semibold">{weapon.name}</div>
                        {cooldown > 0 && (
                          <div className="text-xs text-red-400">Cooldown: {cooldown}s</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Personal Actions */}
            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-xl p-4 border border-blue-500">
              <h3 className="text-lg font-bold text-blue-400 mb-4">Personal Actions</h3>
              <div className="space-y-2">
                {PERSONAL_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => executePersonalAction(action)}
                    className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm flex items-center justify-between"
                  >
                    <span>{action.icon} {action.name}</span>
                    <span className="text-xs">{action.cost} MNT</span>
                  </button>
                ))}
                
                {!isTeamLeader && (
                  <button
                    onClick={revokePermission}
                    className="w-full p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm mt-4"
                  >
                    🚨 REVOKE PERMISSION
                  </button>
                )}
              </div>
              
              {personalAction && (
                <div className="mt-2 text-xs text-green-400 animate-pulse">
                  {personalAction}
                </div>
              )}
            </div>

            {/* Enemies */}
            <AnimatePresence>
              {enemies.map((enemy) => (
                <motion.div
                  key={enemy.id}
                  initial={{ opacity: 0, scale: 0.8, x: 100 }}
                  animate={{ 
                    opacity: enemy.health > 0 ? 1 : 0.3, 
                    scale: enemy.health > 0 ? 1 : 0.8, 
                    x: 0 
                  }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
                  className={`absolute cursor-pointer transition-all duration-200 ${
                    selectedTarget === enemy.id ? 'ring-4 ring-yellow-500' : ''
                  }`}
                  style={{
                    left: enemy.position.x,
                    top: enemy.position.y,
                  }}
                  onClick={() => setSelectedTarget(enemy.id)}
                >
                  <div className="bg-red-600/20 border border-red-500 rounded-lg p-3 backdrop-blur-sm">
                    {/* Enemy Image */}
                    <div className="w-16 h-16 mb-2 relative">
                      <Image
                        src={enemy.image || `/assets/enemies/${enemy.type}.png`}
                        alt={enemy.type}
                        fill
                        className="object-contain rounded"
                        unoptimized
                        onError={(e) => {
                          // Fallback to emoji if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="text-4xl flex items-center justify-center h-full">
                              ${enemy.type === 'tank' ? '🚜' : 
                                enemy.type === 'helicopter' ? '🚁' :
                                enemy.type === 'fortress' ? '🏰' : 
                                enemy.type === 'bomber' ? '✈️' : '💥'}
                            </div>`;
                          }
                        }}
                      />
                    </div>
                    <div className="text-xs font-semibold text-red-300 capitalize">{enemy.type}</div>
                    <div className="w-16 bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400">{enemy.health}/{enemy.maxHealth}</div>
                    {radarActive && (
                      <div className="text-xs text-yellow-400">📡 WEAK POINT</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Battle Effects */}
            {teamShield && (
              <div className="absolute inset-0 border-4 border-blue-500 animate-pulse pointer-events-none">
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500/20 px-4 py-2 rounded-lg">
                  🛡️ TEAM SHIELD ACTIVE
                </div>
              </div>
            )}

            {/* Victory Screen */}
            <AnimatePresence>
              {battlePhase === 'victory' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center"
                >
                  <div className="bg-gradient-to-br from-green-600/20 to-yellow-600/20 border border-green-500 rounded-2xl p-8 text-center">
                    <div className="text-6xl mb-4">🏆</div>
                    <h2 className="text-3xl font-bold text-green-400 mb-4">THE UPSIDE DOWN IS SAFE!</h2>
                    <p className="text-gray-300 mb-6">All creatures from the Upside Down have been defeated!</p>
                    <div className="text-sm text-gray-400 mb-6">
                      Total team spending: {teamMembers.reduce((sum, m) => sum + m.spentAmount, 0).toFixed(3)} MNT
                    </div>
                    <div className="text-sm text-purple-400 mb-6">
                      🔥 Eleven's psychic powers and the team's courage saved Hawkins once again!
                    </div>
                    <button
                      onClick={onBackToLobby}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                      Return to Hawkins
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 bg-black/30 backdrop-blur-sm border-l border-red-500/30 p-4 space-y-4">
          {/* Live Transaction Feed */}
          <div className="bg-black/50 rounded-xl p-4 border border-green-500/30">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-green-500" />
              Live Transaction Feed
            </h3>
            <div 
              ref={battleLogsRef}
              className="bg-black/50 rounded-lg p-3 h-64 overflow-y-auto space-y-2"
            >
              {transactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm border-l-2 border-green-500 pl-3"
                >
                  <div className="font-semibold text-green-400">{tx.weapon}</div>
                  <div className="text-xs text-gray-400">{tx.timestamp}</div>
                  {tx.spentFrom.length > 0 && (
                    <div className="text-xs text-yellow-400 mt-1">
                      {tx.spentFrom.map((spend, i) => (
                        <div key={i}>
                          ├─ {spend.address.substring(0, 6)}...{spend.address.substring(spend.address.length - 4)}: -{spend.amount.toFixed(3)} MNT
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Team Status */}
          <div className="bg-black/50 rounded-xl p-4 border border-purple-500/30">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-500" />
              Team Status
            </h3>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.address} className="bg-black/40 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {/* Character Image */}
                      <div className="w-10 h-10 relative">
                        <Image
                          src={member.characterImage || '/assets/characters/eleven.png'}
                          alt={member.characterName || 'Character'}
                          fill
                          className="object-cover rounded-full border-2 border-purple-500"
                          unoptimized
                          onError={(e) => {
                            // Fallback to emoji if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-lg">
                                ${member.isTeamLeader ? '👑' : '🧑'}
                              </div>`;
                            }
                          }}
                        />
                        {member.isTeamLeader && (
                          <Crown className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />
                        )}
                        {!member.isTeamLeader && (
                          <div className={`w-3 h-3 rounded-full absolute -top-1 -right-1 border border-black ${member.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        )}
                      </div>
                      
                      <div>
                        <div className="text-sm font-semibold text-white">{member.characterName || 'Unknown'}</div>
                        <div className="text-xs text-gray-400">{member.displayName}</div>
                      </div>
                    </div>
                    {member.isTeamLeader && <span className="text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded">LEADER</span>}
                  </div>
                  
                  {!member.isTeamLeader && (
                    <div className="text-xs space-y-1 ml-13">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Delegated:</span>
                        <span className="text-blue-400">{member.delegatedAmount.toFixed(3)} MNT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Spent:</span>
                        <span className="text-red-400">{member.spentAmount.toFixed(3)} MNT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Remaining:</span>
                        <span className="text-green-400">{(member.delegatedAmount - member.spentAmount).toFixed(3)} MNT</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2 italic">{member.lastAction}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Permission Panel Modal */}
      <AnimatePresence>
        {showPermissionPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowPermissionPanel(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-black/90 border border-purple-500 rounded-2xl p-8 max-w-2xl w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-purple-400">🔐 Permission Dashboard</h3>
                <button
                  onClick={() => setShowPermissionPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-3">Team Leader Spending (Last 5 minutes):</h4>
                  <div className="space-y-2">
                    {transactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="bg-black/50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{tx.weapon}</span>
                          <span className="text-red-400">-{tx.cost.toFixed(3)} MNT</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {tx.spentFrom.map((spend, i) => (
                            <span key={i} className="mr-4">
                              {spend.address.substring(0, 6)}...: -{spend.amount.toFixed(3)} MNT
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">Your Wallet Status:</h4>
                  <div className="bg-black/50 rounded-lg p-4">
                    {isTeamLeader ? (
                      <div className="text-center">
                        <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <div className="text-yellow-400 font-semibold">You are the Team Leader</div>
                        <div className="text-sm text-gray-400 mt-2">
                          You have full authority to spend team funds without approval
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between mb-2">
                          <span>Delegated to Team Leader:</span>
                          <span className="text-blue-400">0.1 MNT</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span>Spent so far:</span>
                          <span className="text-red-400">0.03 MNT</span>
                        </div>
                        <div className="flex justify-between mb-4">
                          <span>Remaining:</span>
                          <span className="text-green-400">0.07 MNT</span>
                        </div>
                        
                        <div className="space-y-2">
                          <button
                            onClick={revokePermission}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                          >
                            🚨 EMERGENCY REVOKE ACCESS
                          </button>
                          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                            ➕ Increase Limit to 0.2 MNT
                          </button>
                        </div>
                        
                        <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg">
                          <div className="text-yellow-400 text-sm">
                            ⚠️ Warning: Team Leader can spend remaining 0.07 MNT without asking you!
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}