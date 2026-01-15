'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Zap, Sword, Shield, Crown } from 'lucide-react'
import Image from 'next/image'

interface GameLobbyProps {
  userAddress: string
  onStartBattle: () => void
}

interface TeamLeader {
  id: string
  name: string
  character: string
  power: number
  health: number
  image: string
}

const TEAM_LEADERS: TeamLeader[] = [
  {
    id: 'eleven',
    name: 'Eleven',
    character: '👧',
    power: 95,
    health: 100,
    image: '/assets/characters/eleven.png'
  },
  {
    id: 'steve',
    name: 'Steve Harrington',
    character: '🏏',
    power: 85,
    health: 120,
    image: '/assets/characters/steve.png'
  },
  {
    id: 'dustin',
    name: 'Dustin Henderson',
    character: '🎒',
    power: 75,
    health: 110,
    image: '/assets/characters/dustin.png'
  },
  {
    id: 'mike',
    name: 'Mike Wheeler',
    character: '👦',
    power: 70,
    health: 90,
    image: '/assets/characters/mike.png'
  },
  {
    id: 'lucas',
    name: 'Lucas Sinclair',
    character: '🏹',
    power: 80,
    health: 95,
    image: '/assets/characters/lucas.png'
  },
  {
    id: 'max',
    name: 'Max Mayfield',
    character: '🛹',
    power: 78,
    health: 88,
    image: '/assets/characters/max.png'
  },
  {
    id: 'will',
    name: 'Will Byers',
    character: '🎨',
    power: 65,
    health: 85,
    image: '/assets/characters/will.png'
  },
  {
    id: 'nancy',
    name: 'Nancy Wheeler',
    character: '🔫',
    power: 82,
    health: 92,
    image: '/assets/characters/nancy.png'
  },
  {
    id: 'robin',
    name: 'Robin Buckley',
    character: '🎵',
    power: 68,
    health: 87,
    image: '/assets/characters/robin.png'
  },
  {
    id: 'erica',
    name: 'Erica Sinclair',
    character: '👑',
    power: 72,
    health: 80,
    image: '/assets/characters/erica.png'
  }
]

export function GameLobby({ userAddress, onStartBattle }: GameLobbyProps) {
  const [selectedLeader, setSelectedLeader] = useState<TeamLeader | null>(null)
  const [ownedLeaders, setOwnedLeaders] = useState<string[]>([])
  const [isLoadingLeaders, setIsLoadingLeaders] = useState(true)
  const [battleLogs, setBattleLogs] = useState<string[]>([
    '🔗 Wallet Connected: ' + userAddress.substring(0, 6) + '...' + userAddress.substring(userAddress.length - 4),
    '👻 Ghost-Pay is active!',
    '🎮 Welcome to Stranger Things Battle!',
    '👑 Select a team leader to start your adventure'
  ])

  useEffect(() => {
    loadOwnedLeaders()
  }, [userAddress])

  const loadOwnedLeaders = async () => {
    try {
      setIsLoadingLeaders(true)
      
      // Simulate loading owned leaders
      // In a real app, this would query the blockchain
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For demo, give user access to first two leaders
      setOwnedLeaders(['eleven', 'hopper'])
      
      addBattleLog('📋 Loaded team leaders from blockchain')
    } catch (error) {
      console.error('Error loading leaders:', error)
      addBattleLog('❌ Failed to load team leaders')
    } finally {
      setIsLoadingLeaders(false)
    }
  }

  const addBattleLog = (message: string) => {
    setBattleLogs(prev => [...prev, message])
  }

  const purchaseLeader = async (leader: TeamLeader) => {
    try {
      addBattleLog(`💰 Purchasing ${leader.name}...`)
      
      // Simulate Ghost-Pay transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setOwnedLeaders(prev => [...prev, leader.id])
      addBattleLog(`✅ ${leader.name} purchased successfully via Ghost-Pay!`)
      addBattleLog(`⚡ Transaction processed instantly - no gas fees!`)
    } catch (error) {
      addBattleLog(`❌ Failed to purchase ${leader.name}`)
    }
  }

  const selectLeader = (leader: TeamLeader) => {
    setSelectedLeader(leader)
    addBattleLog(`👑 Selected ${leader.name} as team leader`)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Team Leader Selection */}
      <div className="lg:col-span-2">
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Crown className="w-6 h-6 mr-2 text-yellow-500" />
            👑 TEAM LEADER SHOP 👑
          </h2>
          
          {isLoadingLeaders ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading team leaders...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEAM_LEADERS.map((leader) => {
                const isOwned = ownedLeaders.includes(leader.id)
                const isSelected = selectedLeader?.id === leader.id
                
                return (
                  <motion.div
                    key={leader.id}
                    whileHover={{ scale: 1.02 }}
                    className={`bg-black/40 rounded-xl p-4 border-2 transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-yellow-500 bg-yellow-500/10' 
                        : isOwned 
                        ? 'border-green-500/50 hover:border-green-500' 
                        : 'border-gray-500/30 hover:border-purple-500/50'
                    }`}
                    onClick={() => isOwned && selectLeader(leader)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-800 border-2 border-gray-600">
                        <Image 
                          src={leader.image} 
                          alt={leader.name}
                          width={64}
                          height={64}
                          className="object-cover"
                          unoptimized
                          onError={(e) => {
                            console.error(`Failed to load image: ${leader.image}`)
                            // Fallback to emoji if image fails to load
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.fallback-emoji') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                          onLoad={() => console.log(`Loaded image: ${leader.image}`)}
                        />
                        <div className="fallback-emoji absolute inset-0 flex items-center justify-center text-2xl" style={{display: 'none'}}>
                          {leader.character}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{leader.name}</h3>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <Sword className="w-4 h-4 mr-1 text-red-400" />
                            <span>{leader.power}</span>
                          </div>
                          <div className="flex items-center">
                            <Shield className="w-4 h-4 mr-1 text-blue-400" />
                            <span>{leader.health}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      {isSelected ? (
                        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-2 text-center">
                          <span className="text-yellow-500 font-semibold">✨ SELECTED ✨</span>
                        </div>
                      ) : isOwned ? (
                        <button className="w-full bg-green-500/20 border border-green-500 rounded-lg p-2 text-green-500 font-semibold">
                          ✅ OWNED - Click to Select
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            purchaseLeader(leader)
                          }}
                          className="w-full bg-purple-600 hover:bg-purple-700 rounded-lg p-2 text-white font-semibold transition-colors"
                        >
                          💰 Purchase (0.01 MNT)
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
          
          {/* Start Battle Button */}
          {selectedLeader && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <button
                onClick={onStartBattle}
                className="w-full bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 text-lg"
              >
                ⚔️ START BATTLE WITH {selectedLeader.name.toUpperCase()} ⚔️
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Battle Logs & Info */}
      <div className="space-y-6">
        {/* Ghost-Pay Status */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-green-500" />
            Ghost-Pay Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-green-500 font-semibold">✅ Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Gas Fees:</span>
              <span className="text-green-500 font-semibold">🆓 Free</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">AI Agent:</span>
              <span className="text-green-500 font-semibold">🤖 Ready</span>
            </div>
          </div>
        </div>

        {/* Battle Logs */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-red-500" />
            Battle Logs
          </h3>
          <div className="bg-black/50 rounded-lg p-4 h-64 overflow-y-auto">
            <div className="space-y-1 text-sm font-mono">
              {battleLogs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-red-400"
                >
                  {log}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Game Info */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
          <h3 className="text-lg font-bold mb-4 text-cyan-400">How to Play</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• Purchase team leaders with Ghost-Pay</li>
            <li>• Select your favorite character</li>
            <li>• Battle Demogorgons and Vecna</li>
            <li>• Use power-ups and coordinate attacks</li>
            <li>• All transactions are instant with Ghost-Pay!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}