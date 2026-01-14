# Teammate Screen Not Showing War - FIX APPLIED

## 🐛 Problem Identified

The backend logs showed:
```
❌ 0xCb18...f268 (0xCb188D...) - NO WEBSOCKET STORED
⚠️  WARNING: 1 team members did not receive the message!
```

**Root Cause**: When a teammate completes the delegation process, their WebSocket connection was not properly registered with the battle. The WebSocket connected BEFORE the delegation page, but after delegation completed, the teammate never re-registered their connection.

## ✅ Fix Applied

### 1. Re-register WebSocket After Delegation
Modified `delegatePermission()` function to:
- Send `WAR_BATTLE_CONNECT` message FIRST to register the WebSocket
- Then send `WAR_DELEGATION_COMPLETE` message
- Added 100ms delay between messages to ensure proper registration

```typescript
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
    wsRef.current.send(JSON.stringify({
      type: 'WAR_DELEGATION_COMPLETE',
      payload: { battleId, playerAddress: userAddress, amount, transactionHash: txHash }
    }))
  }, 100)
}
```

### 2. Auto-Reconnect When Entering Battle Phase
Added a new `useEffect` hook that automatically re-registers the WebSocket when the battle phase changes from 'delegation' to 'battle':

```typescript
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
```

## 🧪 How to Test

### Test Scenario: Multiplayer War Battle with Teammate

1. **Host (Team Leader)**:
   - Create a room
   - Wait for teammate to join
   - Start game
   - Select character
   - Enter war battle (no delegation needed)

2. **Teammate (Non-Leader)**:
   - Join the room
   - Ready up
   - Select character
   - **DelegationPage appears** - Enter amount (e.g., 0.5 MNT)
   - Approve in MetaMask
   - **After delegation completes, you should see the war battle screen**

3. **Verify Real-Time Updates**:
   - Host launches a weapon (e.g., Molotov Cocktail)
   - **Teammate screen should update immediately** showing:
     - Enemy health decreasing
     - Team pool decreasing
     - Transaction appearing in history
     - Weapon animation

4. **Check Backend Logs**:
   - Should see: `✅ Sent to 0xCb18...f268` (teammate)
   - Should NOT see: `❌ NO WEBSOCKET STORED`
   - Should see: `📢 Broadcast complete: 2 sent, 0 failed`

## 🔍 Debug Logs to Watch

### Frontend (Teammate Browser Console):
```
🔗 Re-registering WebSocket connection with battle after delegation...
🔄 Battle phase changed to "battle" - ensuring WebSocket is registered...
📨 WAR BATTLE WebSocket message received: WAR_BATTLE_CONNECTED
📨 WAR BATTLE WebSocket message received: WAR_WEAPON_LAUNCHED
✅ Updating team members with fresh data
✅ Updating enemies with fresh data
```

### Backend (Terminal):
```
🔗 War battle connect: 0xCb188D... to battle war_...
✅ 0xCb18...f268 connected to war battle
📢 Broadcasting to war battle: WAR_WEAPON_LAUNCHED
📊 Battle has 2 team members, 2 WebSocket connections
  ✅ Sent to 0x24c8...758c (team leader)
  ✅ Sent to 0xCb18...f268 (teammate)
📢 Broadcast complete: 2 sent, 0 failed
```

## 📝 Files Modified

- `nextjs-dapp/src/components/war/ImprovedWarBattle.tsx`
  - Modified `delegatePermission()` function
  - Added new `useEffect` hook for battle phase changes

## 🎯 Expected Behavior After Fix

1. ✅ Teammate sees delegation page
2. ✅ Teammate delegates funds via MetaMask
3. ✅ Teammate automatically enters war battle screen
4. ✅ Teammate's WebSocket is properly registered
5. ✅ Teammate sees all real-time updates when host launches weapons
6. ✅ Both players see synchronized battle state

## 🚀 Next Steps

1. Refresh the frontend page (Ctrl+R or Cmd+R)
2. Test with two browser windows (one host, one teammate)
3. Verify that teammate screen updates in real-time
4. Check backend logs to confirm both WebSockets are registered

The fix ensures that teammates properly register their WebSocket connection after completing the delegation process, allowing them to receive real-time battle updates.
