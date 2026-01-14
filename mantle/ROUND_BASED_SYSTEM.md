# Round-Based Battle System

## 🎮 New Feature: Multi-Round Battles

### Overview
The game now features a progressive round-based system where defeating all enemies advances you to the next round with stronger foes!

## 📊 Round Progression

### Round 1
- **Enemies**: 3 Demogorgons
- **Health**: 300 HP each
- **Damage**: 50 DMG each
- **Difficulty**: Easy (starter round)

### Round 2
- **Enemies**: 3 Demogorgons
- **Health**: 390 HP each (+30%)
- **Damage**: 60 DMG each (+20%)
- **Difficulty**: Medium

### Round 3
- **Enemies**: 4 enemies (1 Mind Flayer + 3 Demogorgons)
- **Health**: 507 HP / 660 HP (Mind Flayer)
- **Damage**: 72 DMG / 117 DMG (Mind Flayer)
- **Difficulty**: Hard

### Round 4
- **Enemies**: 4 enemies (1 Mind Flayer + 3 Demogorgons)
- **Health**: 624 HP / 880 HP (Mind Flayer)
- **Damage**: 84 DMG / 135 DMG (Mind Flayer)
- **Difficulty**: Very Hard

### Round 5 (BOSS ROUND)
- **Enemies**: 5 enemies (1 Vecna + 2 Mind Flayers + 2 Demogorgons)
- **Health**: 1,040 HP (Vecna) / 800 HP (Mind Flayers) / 780 HP (Demogorgons)
- **Damage**: 180 DMG (Vecna) / 150 DMG (Mind Flayers) / 96 DMG (Demogorgons)
- **Difficulty**: EXTREME
- **Victory**: Defeating all enemies in Round 5 = FINAL VICTORY! 🏆

## 🎯 Scaling System

### Health Scaling
- **Formula**: Base Health × (1 + (Round - 1) × 0.3)
- **Example**: Round 3 = 300 × 1.6 = 480 HP

### Damage Scaling
- **Formula**: Base Damage × (1 + (Round - 1) × 0.2)
- **Example**: Round 3 = 50 × 1.4 = 70 DMG

### Enemy Count
- Rounds 1-2: 3 enemies
- Rounds 3-4: 4 enemies
- Round 5+: 5 enemies

## 🎬 Round Transition

When all enemies are defeated:

1. **3-Second Celebration Screen**:
   ```
   🎉
   ROUND X COMPLETE!
   Preparing Round X+1...
   ⚔️ (spinning)
   ```

2. **New Enemies Spawn**:
   - Stronger health
   - Higher damage
   - More enemies (in later rounds)

3. **Battle Continues**:
   - Same team pool
   - Same delegations
   - Keep fighting!

## 🏆 Victory Conditions

### Round Victory
- Defeat all enemies in current round
- Advance to next round
- Enemies get stronger

### Final Victory
- Complete all 5 rounds
- Defeat the final boss (Vecna)
- Game ends with victory screen

## 💡 Strategy Tips

1. **Save Funds**: Don't waste expensive weapons on early rounds
2. **Vote Wisely**: Use cheaper weapons (Molotov) for weak enemies
3. **Boss Preparation**: Save Nuclear Warhead for Round 5
4. **Team Coordination**: Discuss strategy during voting
5. **Pool Management**: Make sure everyone delegates enough for 5 rounds

## 📈 Recommended Weapon Usage

### Rounds 1-2 (Easy)
- **Molotov Cocktail** (0.001 MNT, 150 DMG)
- **Flamethrower** (0.003 MNT, 300 DMG)
- Total cost: ~0.01-0.02 MNT

### Rounds 3-4 (Hard)
- **Grenade Launcher** (0.005 MNT, 500 DMG)
- **Rocket Launcher** (0.008 MNT, 800 DMG)
- Total cost: ~0.03-0.05 MNT

### Round 5 (BOSS)
- **Nuclear Warhead** (0.015 MNT, 1500 DMG)
- **Multiple Rockets** (0.008 MNT each, 800 DMG)
- Total cost: ~0.05-0.08 MNT

### Total Estimated Cost
- **Full 5-Round Victory**: ~0.15-0.20 MNT per player
- **Recommended Delegation**: 0.3-0.5 MNT per player

## 🎨 UI Features

### Header
- Shows **"ROUND X"** in animated text
- Pulses and scales for emphasis
- Updates in real-time

### Round Transition
- Full-screen overlay
- Celebration animation
- 3-second countdown
- Spinning sword emoji

### Enemy Cards
- Show **"X/Y Alive"** counter
- Health bars change color (green → yellow → red)
- Defeated enemies show "DEFEATED" overlay

## 🔧 Technical Details

### Backend
- `generateRoundEnemies(round)` function creates scaled enemies
- Checks for round completion after each weapon
- Broadcasts `WAR_ROUND_COMPLETE` message
- Waits 3 seconds before spawning new enemies

### Frontend
- Listens for `WAR_ROUND_COMPLETE` event
- Shows transition overlay
- Updates round number
- Refreshes enemy list

### WebSocket Messages
- `WAR_ROUND_COMPLETE`: Round finished, new round starting
- `WAR_WEAPON_LAUNCHED`: Includes round number
- `WAR_BATTLE_CONNECTED`: Includes current round

## 🎮 Example Game Flow

```
Round 1: Start
→ Defeat 3 Demogorgons (300 HP each)
→ "ROUND 1 COMPLETE!"

Round 2: 3 seconds later
→ 3 Demogorgons spawn (390 HP each)
→ Defeat them
→ "ROUND 2 COMPLETE!"

Round 3: 3 seconds later
→ 1 Mind Flayer + 3 Demogorgons spawn
→ Defeat them
→ "ROUND 3 COMPLETE!"

Round 4: 3 seconds later
→ 1 Mind Flayer + 3 Demogorgons spawn (stronger)
→ Defeat them
→ "ROUND 4 COMPLETE!"

Round 5: 3 seconds later (BOSS ROUND)
→ 1 Vecna + 2 Mind Flayers + 2 Demogorgons spawn
→ Epic battle!
→ Defeat all
→ "🏆 FINAL VICTORY! 🏆"
```

## 🎉 Ready to Battle!

The round-based system adds depth and strategy to the game. Work together, manage your funds wisely, and defeat all 5 rounds to achieve ultimate victory!

Good luck, team! ⚔️🎮
