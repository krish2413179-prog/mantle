'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Crown, Zap, Heart, Shield, Users } from 'lucide-react'
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

interface CharacterSelectionProps {
  userAddress: string
  currentRoom?: any // Room data for multiplayer battles
  onCharacterSelected: (character: Character) => void
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

export function CharacterSelection({ userAddress, currentRoom, onCharacterSelected, onBackToLobby }: CharacterSelectionProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hoveredCharacter, setHoveredCharacter] = useState<string | null>(null)

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character)
  }

  const handleConfirmSelection = async () => {
    if (!selectedCharacter) return
    
    setIsLoading(true)
    
    // Simulate loading time for dramatic effect
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    onCharacterSelected(selectedCharacter)
  }

  const getStatColor = (value: number) => {
    if (value >= 90) return 'text-purple-400'
    if (value >= 75) return 'text-blue-400'
    if (value >= 60) return 'text-green-400'
    if (value >= 40) return 'text-yellow-400'
    return 'text-gray-400'
  }

  const getStatBarColor = (value: number) => {
    if (value >= 90) return 'bg-purple-500'
    if (value >= 75) return 'bg-blue-500'
    if (value >= 60) return 'bg-green-500'
    if (value >= 40) return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900/20 via-purple-900/20 to-black text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-32 h-32 relative mb-8 mx-auto">
            <Image
              src={selectedCharacter?.image || '/assets/characters/eleven.png'}
              alt={selectedCharacter?.name || 'Character'}
              fill
              className="object-cover rounded-full border-4 border-purple-500"
              unoptimized
            />
          </div>
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-6xl mb-4"
          >
            🌀
          </motion.div>
          
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-red-400 bg-clip-text text-transparent">
            Entering the Upside Down...
          </h2>
          
          <p className="text-xl text-gray-300 mb-4">
            {selectedCharacter?.name} is preparing for battle
          </p>
          
          <div className="text-sm text-purple-400">
            {selectedCharacter?.specialAbility}
          </div>
        </motion.div>
      </div>
    )
  }

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
              🎭 Choose Your Character
            </h1>
            <p className="text-sm text-gray-400">Select your Stranger Things hero for the battle ahead</p>
          </div>
          
          <div className="w-32" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Character Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {STRANGER_THINGS_CHARACTERS.map((character) => (
                <motion.div
                  key={character.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative cursor-pointer rounded-xl p-4 border-2 transition-all ${
                    selectedCharacter?.id === character.id
                      ? 'border-purple-500 bg-purple-500/20'
                      : hoveredCharacter === character.id
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-gray-600 bg-black/30 hover:border-gray-500'
                  }`}
                  onClick={() => handleCharacterSelect(character)}
                  onMouseEnter={() => setHoveredCharacter(character.id)}
                  onMouseLeave={() => setHoveredCharacter(null)}
                >
                  {character.isLeader && (
                    <Crown className="w-4 h-4 text-yellow-500 absolute top-2 right-2" />
                  )}
                  
                  <div className="w-20 h-20 relative mx-auto mb-3">
                    <Image
                      src={character.image}
                      alt={character.name}
                      fill
                      className="object-cover rounded-full border-2 border-purple-500"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-2xl">🧑</div>`;
                        }
                      }}
                    />
                  </div>
                  
                  <h3 className="text-sm font-bold text-center text-white mb-1">
                    {character.name}
                  </h3>
                  
                  <div className="text-xs text-center text-gray-400">
                    {character.specialAbility.split(' - ')[0]}
                  </div>
                  
                  {selectedCharacter?.id === character.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-purple-500/20 rounded-xl flex items-center justify-center"
                    >
                      <div className="text-purple-400 text-2xl">✓</div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Character Details */}
          <div className="lg:col-span-1">
            <div className="bg-black/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 sticky top-6">
              {selectedCharacter ? (
                <motion.div
                  key={selectedCharacter.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 relative">
                      <Image
                        src={selectedCharacter.image}
                        alt={selectedCharacter.name}
                        fill
                        className="object-cover rounded-full border-2 border-purple-500"
                        unoptimized
                      />
                      {selectedCharacter.isLeader && (
                        <Crown className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedCharacter.name}</h2>
                      {selectedCharacter.isLeader && (
                        <span className="text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded">
                          TEAM LEADER
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-6">
                    {selectedCharacter.description}
                  </p>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-purple-400 mb-3">Special Ability</h3>
                    <div className="bg-purple-500/20 border border-purple-500 rounded-lg p-3">
                      <p className="text-sm text-purple-300">{selectedCharacter.specialAbility}</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-blue-400 mb-3">Character Stats</h3>
                    <div className="space-y-3">
                      {Object.entries(selectedCharacter.stats).map(([stat, value]) => (
                        <div key={stat} className="flex items-center justify-between">
                          <span className="text-sm text-gray-400 capitalize flex items-center">
                            {stat === 'psychic' && <Zap className="w-4 h-4 mr-1" />}
                            {stat === 'combat' && <Shield className="w-4 h-4 mr-1" />}
                            {stat === 'tech' && <Users className="w-4 h-4 mr-1" />}
                            {stat === 'leadership' && <Crown className="w-4 h-4 mr-1" />}
                            {stat}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${getStatBarColor(value)}`}
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span className={`text-sm font-semibold ${getStatColor(value)}`}>
                              {value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmSelection}
                    className="w-full bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105"
                  >
                    🚀 Enter Battle as {selectedCharacter.name}
                  </button>
                </motion.div>
              ) : (
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">🎭</div>
                  <h3 className="text-xl font-semibold mb-2">Select a Character</h3>
                  <p className="text-sm">
                    Choose your Stranger Things hero to see their stats and abilities
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}