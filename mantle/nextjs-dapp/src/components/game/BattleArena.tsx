'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Zap, Heart, Shield, Sword, Target } from 'lucide-react'
import Image from 'next/image'

interface BattleArenaProps {
  userAddress: string
  onBackToLobby: () => void
}

interface Enemy {
  id: string
  type: 'demogorgon' | 'vecna' | 'mindflayer'
  health: number
  maxHealth: number
  damage: number
  position: { x: number; y: number }
  image: string
}

interface Character {
  id: string
  name: string
  emoji: string
  health: number
  maxHealth: number
  position: { x: number; y: number }
  image: string
}

interface Projectile {
  id: string
  startX: number
  startY: number
  targetX: number
  targetY: number
  damage: number
  character: string
}

const CHARACTERS: Character[] = [
  { id: 'eleven', name: 'Eleven', emoji: '👧', health: 100, maxHealth: 100, position: { x: 100, y: 200 }, image: '/assets/characters/eleven.png' },
  { id: 'mike', name: 'Mike', emoji: '👦', health: 80, maxHealth: 80, position: { x: 100, y: 280 }, image: '/assets/characters/mike.png' },
  { id: 'dustin', name: 'Dustin', emoji: '🎒', health: 90, maxHealth: 90, position: { x: 100, y: 360 }, image: '/assets/characters/dustin.png' },
  { id: 'lucas', name: 'Lucas', emoji: '🏹', health: 85, maxHealth: 85, position: { x: 100, y: 440 }, image: '/assets/characters/lucas.png' },
]

export function BattleArena({ userAddress, onBackToLobby }: BattleArenaProps) {
  const [characters, setCharacters] = useState<Character[]>(CHARACTERS)
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  const [selectedEnemy, setSelectedEnemy] = useState<string | null>(null)
  const [round, setRound] = useState(1)
  const [battlePhase, setBattlePhase] = useState<'setup' | 'battle' | 'victory' | 'defeat'>('setup')
  const [battleLogs, setBattleLogs] = useState<string[]>([
    '⚔️ Battle Arena initialized',
    '👑 Team leader ready for combat',
    '🎯 Select characters and targets to attack'
  ])
  const [particles, setParticles] = useState<Array<{ id: string; x: number; y: number; type: string }>>([])
  
  const wsRef = useRef<WebSocket | null>(null)
  const arenaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initializeBattle()
    connectWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    // Animate projectiles
    const interval = setInterval(() => {
      setProjectiles(prev => prev.filter(p => {
        // Remove projectiles that have reached their target
        const dx = p.targetX - p.startX
        const dy = p.targetY - p.startY
        const distance = Math.sqrt(dx * dx + dy * dy)
        return distance > 10 // Keep projectiles until they're close to target
      }))
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081')
      
      wsRef.current.onopen = () => {
        addBattleLog('🔗 Connected to battle server')
      }
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      }
      
      wsRef.current.onclose = () => {
        addBattleLog('📡 Disconnected from battle server')
      }
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      addBattleLog('❌ Failed to connect to battle server')
    }
  }

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'BATTLE_JOINED':
        setEnemies(data.enemies)
        setBattlePhase('battle')
        addBattleLog(`🎮 Battle started - Round ${round}`)
        break
      case 'ATTACK_RESULT':
        handleAttackResult(data)
        break
      case 'BATTLE_WON':
        setBattlePhase('victory')
        addBattleLog('🏆 Victory! All enemies defeated!')
        break
      case 'ERROR':
        addBattleLog(`❌ ${data.message}`)
        break
    }
  }

  const initializeBattle = () => {
    // Generate initial enemies for round 1
    const initialEnemies: Enemy[] = [
      {
        id: 'enemy_1',
        type: 'demogorgon',
        health: 150,
        maxHealth: 150,
        damage: 25,
        position: { x: 600, y: 200 },
        image: '/assets/enemies/demogorgan.png'
      },
      {
        id: 'enemy_2',
        type: 'demogorgon',
        health: 150,
        maxHealth: 150,
        damage: 25,
        position: { x: 650, y: 300 },
        image: '/assets/enemies/demogorgan.png'
      }
    ]
    
    setEnemies(initialEnemies)
    setBattlePhase('battle')
    
    // Join battle via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'JOIN_BATTLE',
        payload: {
          playerAddress: userAddress,
          leaderTokenId: '1' // Default leader
        }
      }))
    }
  }

  const addBattleLog = (message: string) => {
    setBattleLogs(prev => [...prev.slice(-9), message]) // Keep last 10 logs
  }

  const handleCharacterClick = (characterId: string) => {
    if (battlePhase !== 'battle') return
    setSelectedCharacter(characterId)
    addBattleLog(`👤 Selected ${characters.find(c => c.id === characterId)?.name}`)
  }

  const handleEnemyClick = (enemyId: string) => {
    if (battlePhase !== 'battle' || !selectedCharacter) return
    
    setSelectedEnemy(enemyId)
    executeAttack(selectedCharacter, enemyId)
  }

  const executeAttack = (characterId: string, enemyId: string) => {
    const character = characters.find(c => c.id === characterId)
    const enemy = enemies.find(e => e.id === enemyId)
    
    if (!character || !enemy) return

    const damage = Math.floor(Math.random() * 30) + 20 // 20-50 damage
    
    // Create projectile
    const projectile: Projectile = {
      id: `proj_${Date.now()}`,
      startX: character.position.x + 30,
      startY: character.position.y + 15,
      targetX: enemy.position.x,
      targetY: enemy.position.y + 15,
      damage,
      character: character.name
    }
    
    setProjectiles(prev => [...prev, projectile])
    
    // Create particles at character position
    createParticles(character.position.x + 30, character.position.y + 15, 'attack')
    
    addBattleLog(`⚡ ${character.name} attacks ${enemy.type} for ${damage} damage!`)
    
    // Send attack to server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'ATTACK_ENEMY',
        payload: {
          playerAddress: userAddress,
          enemyId,
          attackerCharacter: character.name,
          damage
        }
      }))
    }
    
    // Apply damage locally for immediate feedback
    setTimeout(() => {
      setEnemies(prev => prev.map(e => 
        e.id === enemyId 
          ? { ...e, health: Math.max(0, e.health - damage) }
          : e
      ))
      
      // Create impact particles
      createParticles(enemy.position.x, enemy.position.y + 15, 'impact')
      
      // Check if enemy is defeated
      if (enemy.health - damage <= 0) {
        addBattleLog(`💀 ${enemy.type} defeated!`)
        createParticles(enemy.position.x, enemy.position.y + 15, 'explosion')
        
        setTimeout(() => {
          setEnemies(prev => prev.filter(e => e.id !== enemyId))
        }, 500)
      }
    }, 800) // Delay for projectile travel time
    
    setSelectedCharacter(null)
    setSelectedEnemy(null)
  }

  const handleAttackResult = (data: any) => {
    const { enemyId, damage, enemyHealth } = data
    
    setEnemies(prev => prev.map(e => 
      e.id === enemyId 
        ? { ...e, health: enemyHealth }
        : e
    ))
    
    if (enemyHealth <= 0) {
      addBattleLog(`💀 Enemy defeated!`)
    }
  }

  const createParticles = (x: number, y: number, type: string) => {
    const newParticles = Array.from({ length: 5 }, (_, i) => ({
      id: `particle_${Date.now()}_${i}`,
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      type
    }))
    
    setParticles(prev => [...prev, ...newParticles])
    
    // Remove particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => 
        !newParticles.some(np => np.id === p.id)
      ))
    }, 1000)
  }

  const usePowerup = (type: string) => {
    if (battlePhase !== 'battle') return
    
    addBattleLog(`✨ Using ${type} powerup via Ghost-Pay...`)
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'USE_POWERUP',
        payload: {
          playerAddress: userAddress,
          powerupType: type,
          cost: 10
        }
      }))
    }
    
    // Apply powerup effect
    switch (type) {
      case 'heal':
        setCharacters(prev => prev.map(c => ({
          ...c,
          health: Math.min(c.maxHealth, c.health + 30)
        })))
        addBattleLog('💚 Team healed for 30 HP!')
        break
      case 'boost':
        addBattleLog('⚡ Attack damage boosted!')
        break
      case 'shield':
        addBattleLog('🛡️ Defense increased!')
        break
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900/20 via-purple-900/20 to-black">
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
              <div className="text-2xl font-bold text-red-400">Round {round}</div>
              <div className="text-sm text-gray-400">Battle Arena</div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => usePowerup('heal')}
                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-semibold transition-colors"
              >
                💚 Heal (10 Gold)
              </button>
              <button
                onClick={() => usePowerup('boost')}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-semibold transition-colors"
              >
                ⚡ Boost (10 Gold)
              </button>
              <button
                onClick={() => usePowerup('shield')}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-semibold transition-colors"
              >
                🛡️ Shield (10 Gold)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Battle Arena */}
        <div className="flex-1 relative overflow-hidden" ref={arenaRef}>
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-purple-900/10">
            {/* Characters */}
            <AnimatePresence>
              {characters.map((character) => (
                <motion.div
                  key={character.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`absolute cursor-pointer transition-all duration-200 ${
                    selectedCharacter === character.id 
                      ? 'ring-4 ring-yellow-500 ring-opacity-50' 
                      : 'hover:scale-110'
                  }`}
                  style={{
                    left: character.position.x,
                    top: character.position.y,
                  }}
                  onClick={() => handleCharacterClick(character.id)}
                >
                  <div className="bg-blue-600/20 border border-blue-500 rounded-lg p-3 backdrop-blur-sm">
                    <div className="relative w-12 h-12 mb-2 rounded-lg overflow-hidden bg-gray-800 border border-blue-400">
                      <Image 
                        src={character.image} 
                        alt={character.name}
                        width={48}
                        height={48}
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          console.error(`Failed to load character image: ${character.image}`)
                          // Fallback to emoji if image fails to load
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.fallback-emoji');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="fallback-emoji absolute inset-0 flex items-center justify-center text-xl" style={{display: 'none'}}>
                        {character.emoji}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-blue-300">{character.name}</div>
                    <div className="w-16 bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(character.health / character.maxHealth) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400">{character.health}/{character.maxHealth}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Enemies */}
            <AnimatePresence>
              {enemies.map((enemy) => (
                <motion.div
                  key={enemy.id}
                  initial={{ opacity: 0, scale: 0.8, x: 100 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 180 }}
                  className={`absolute cursor-pointer transition-all duration-200 ${
                    selectedEnemy === enemy.id 
                      ? 'ring-4 ring-red-500 ring-opacity-50' 
                      : 'hover:scale-110'
                  }`}
                  style={{
                    left: enemy.position.x,
                    top: enemy.position.y,
                  }}
                  onClick={() => handleEnemyClick(enemy.id)}
                >
                  <div className="bg-red-600/20 border border-red-500 rounded-lg p-3 backdrop-blur-sm">
                    <div className="relative w-12 h-12 mb-2 rounded-lg overflow-hidden bg-gray-800 border border-red-400">
                      <Image 
                        src={enemy.image || `/assets/enemies/${enemy.type === 'demogorgon' ? 'demogorgan' : enemy.type}.png`} 
                        alt={enemy.type}
                        width={48}
                        height={48}
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          console.error(`Failed to load enemy image: ${enemy.image}`)
                          // Fallback to emoji if image fails to load
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.fallback-emoji');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="fallback-emoji absolute inset-0 flex items-center justify-center text-xl" style={{display: 'none'}}>
                        {enemy.type === 'vecna' ? '👹' : enemy.type === 'mindflayer' ? '🐙' : '👾'}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-red-300 capitalize">{enemy.type}</div>
                    <div className="w-16 bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400">{enemy.health}/{enemy.maxHealth}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Projectiles */}
            <AnimatePresence>
              {projectiles.map((projectile) => (
                <motion.div
                  key={projectile.id}
                  initial={{ 
                    x: projectile.startX, 
                    y: projectile.startY,
                    scale: 0.5,
                    opacity: 0
                  }}
                  animate={{ 
                    x: projectile.targetX, 
                    y: projectile.targetY,
                    scale: 1,
                    opacity: 1
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute pointer-events-none"
                >
                  <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-lg">
                    <div className="w-full h-full bg-gradient-to-r from-yellow-300 to-orange-500 rounded-full animate-pulse" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Particles */}
            <AnimatePresence>
              {particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  initial={{ 
                    x: particle.x, 
                    y: particle.y,
                    scale: 0,
                    opacity: 1
                  }}
                  animate={{ 
                    x: particle.x + (Math.random() - 0.5) * 100,
                    y: particle.y - Math.random() * 50,
                    scale: 1,
                    opacity: 0
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute pointer-events-none"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    particle.type === 'attack' ? 'bg-blue-400' :
                    particle.type === 'impact' ? 'bg-red-400' :
                    'bg-yellow-400'
                  }`} />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Battle Instructions */}
            {battlePhase === 'battle' && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
                  <div className="text-center text-white">
                    {!selectedCharacter ? (
                      <div className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-blue-400" />
                        <span>Select a character to attack with</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Sword className="w-5 h-5 text-red-400" />
                        <span>Click an enemy to attack</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Battle Logs Sidebar */}
        <div className="w-80 bg-black/30 backdrop-blur-sm border-l border-red-500/30 p-4">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-red-500" />
            Battle Logs
          </h3>
          
          <div className="bg-black/50 rounded-lg p-4 h-96 overflow-y-auto">
            <div className="space-y-1 text-sm font-mono">
              {battleLogs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="text-red-400"
                >
                  {log}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Team Status */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3 flex items-center">
              <Heart className="w-4 h-4 mr-2 text-green-500" />
              Team Status
            </h4>
            <div className="space-y-2">
              {characters.map((character) => (
                <div key={character.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <span className="mr-2">{character.emoji}</span>
                    {character.name}
                  </span>
                  <span className={`font-semibold ${
                    character.health > character.maxHealth * 0.7 ? 'text-green-400' :
                    character.health > character.maxHealth * 0.3 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {character.health}/{character.maxHealth}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Victory/Defeat Screen */}
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
                  <h2 className="text-3xl font-bold text-green-400 mb-4">VICTORY!</h2>
                  <p className="text-gray-300 mb-6">You have defeated all enemies!</p>
                  <button
                    onClick={onBackToLobby}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Return to Lobby
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}