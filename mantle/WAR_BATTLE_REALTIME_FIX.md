# War Battle Real-Time Update Fix

## Problem
Team members' screens were freezing/not updating when:
- Team leader launched weapons
- Enemy health changed
- Team pool decreased
- Other team members delegated

## Root Cause
Same issue as the room lobby - **stale closure in WebSocket handlers**. The handlers were capturing old state values and not triggering re-renders.

## Solution Applied

### 1. Functional State Updates
Changed from direct state updates to functional updates to avoid stale closures:

**Before (Stale State)**:
```typescript
case 'WAR_WEAPON_LAUNCHED':
  setTeamMembers(data.teamMembers)  // Uses stale closure
  setEnemies(data.enemies)          // Uses stale closure
  break
```

**After (Fresh State)**:
```typescript
case 'WAR_WEAPON_LAUNCHED':
  setTeamMembers(() => [...data.teamMembers])  // Always fresh!
  setEnemies(() => [...data.enemies])          // Always fresh!
  break
```

### 2. Force Re-render with Dynamic Keys
Added keys that include changing values to force React to detect updates:

**Enemy Cards**:
```typescript
// Before
key={enemy.id}

// After
key={`${enemy.id}-${enemy.health}-${enemy.isDestroyed}`}
// Re-renders when health or destroyed status changes!
```

**Team Member Cards**:
```typescript
// Before
key={member.address}

// After
key={`${member.address}-${member.delegatedAmount}-${member.spentAmount}`}
// Re-renders when delegation or spending changes!
```

## What's Fixed

### ✅ Team Members Now See:
1. **Weapon Launches** - Instant animation and effects
2. **Enemy Health Updates** - Health bars decrease in real-time
3. **Team Pool Changes** - Pool decreases when weapons are used
4. **Delegation Updates** - Pool increases when members delegate
5. **Transaction History** - New transactions appear immediately

### ✅ All Players Experience:
- Synchronized battle state
- Real-time updates without refresh
- Smooth animations
- No frozen screens

## Technical Details

### WebSocket Message Flow
```
Leader clicks weapon
  ↓
Backend executes gasless transaction
  ↓
Backend broadcasts WAR_WEAPON_LAUNCHED
  ↓
All players receive message
  ↓
Functional state updates trigger
  ↓
React detects changes (via keys)
  ↓
UI re-renders with new data
  ↓
✅ All players see update!
```

### State Update Pattern
```typescript
// Pattern used for all war battle updates
setStateVariable(prevState => {
  console.log('Updating with fresh data')
  return [...newData]  // New array reference
})
```

### Key Pattern
```typescript
// Pattern for forcing re-renders
key={`${uniqueId}-${changingValue1}-${changingValue2}`}
```

## Files Modified

1. ✅ `nextjs-dapp/src/components/war/ImprovedWarBattle.tsx`
   - Updated `handleWebSocketMessage` to use functional updates
   - Added dynamic keys to enemy cards
   - Added dynamic keys to team member cards

## Testing

### Test 1: Weapon Launch
1. Create multiplayer battle
2. Team member grants permission
3. Leader clicks weapon
4. **Expected**: All players see:
   - ✅ Weapon animation
   - ✅ Enemy health decrease
   - ✅ Team pool decrease
   - ✅ Transaction in history

### Test 2: Multiple Weapons
1. Leader clicks multiple weapons rapidly
2. **Expected**: All players see each weapon launch
3. **Expected**: Enemy health updates for each hit
4. **Expected**: Team pool decreases correctly

### Test 3: Delegation
1. Team member grants permission
2. **Expected**: Leader sees pool increase immediately
3. **Expected**: Team member card updates with delegation amount

## Debugging

If updates still don't work:

1. **Check Console Logs**:
   ```
   📨 WAR BATTLE WebSocket message received: WAR_WEAPON_LAUNCHED
   ✅ Updating team members with fresh data
   ✅ Updating enemies with fresh data
   ✅ Adding transaction to history
   ✅ All players should see the update now!
   ```

2. **Check WebSocket Connection**:
   - Look for "🟢 Connected" in battle header
   - If disconnected, refresh page

3. **Check Backend Logs**:
   ```
   📢 Broadcasting to war battle: WAR_WEAPON_LAUNCHED
   ✅ Sent to all team members
   📢 Broadcast complete: X sent, 0 failed
   ```

## Related Fixes

This fix uses the same pattern as:
- ✅ Room lobby auto-refresh fix (PLAYER_JOINED, PLAYER_READY)
- ✅ Functional state updates to avoid stale closures
- ✅ Dynamic keys to force React re-renders

## Status

✅ **FIXED** - War battle now updates in real-time for all players!

## Next Steps

If you still see freezing:
1. Hard refresh both browser windows (Ctrl+Shift+R)
2. Check browser console for errors
3. Check backend logs for broadcast failures
4. Verify WebSocket connection is open

---

**Fixed**: January 15, 2026
**Impact**: All team members now see real-time battle updates
**Pattern**: Functional state updates + dynamic keys
