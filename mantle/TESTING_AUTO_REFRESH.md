# Quick Testing Guide - Auto-Refresh Fix

## 🚀 Quick Start

### Backend & Frontend Status
- ✅ Backend: Running on port 3001 (WebSocket: 8081) - Process ID: 12
- ✅ Frontend: Running on http://localhost:3002 - Process ID: 13

## 🧪 Test Scenarios

### Test 1: Room Lobby - New Player Join
**Goal**: Verify host sees new player without manual refresh

**Steps**:
1. Open http://localhost:3002 in Browser 1 (Chrome)
2. Connect wallet, click "Multiplayer"
3. Create a room (name it "Test Room")
4. **Keep this window open and watch the player list**
5. Open http://localhost:3002 in Browser 2 (Incognito/Firefox)
6. Connect different wallet, click "Multiplayer"
7. Enter the room code from Browser 1
8. Click "Join Room"

**Expected Result**:
- ✅ Browser 1 (host) should see Browser 2 appear in player list **immediately**
- ✅ No manual refresh needed
- ✅ Backend logs show: "📢 Broadcast complete: 2 sent, 0 failed"

**If it fails**:
- Check backend logs for "❌ Failed to send"
- Look for WebSocket state issues
- Try refreshing both browsers and testing again

---

### Test 2: Delegation - Team Pool Update
**Goal**: Verify team leader sees pool increase when member delegates

**Steps**:
1. Continue from Test 1 (2 players in room)
2. Both players click "Ready"
3. Host clicks "Start Game"
4. Select characters (both click "Confirm")
5. **Browser 1 (host/leader)**: Watch the "Team Pool" at top right
6. **Browser 2 (member)**: Click "Delegate 0.1 MNT" button
7. Approve in MetaMask
8. Wait for transaction confirmation

**Expected Result**:
- ✅ Browser 1 sees "Team Pool" increase from 0 to 0.1 MNT **immediately**
- ✅ No manual refresh needed
- ✅ Backend logs show: "🔐 Delegation completed" and "📢 Broadcast complete"

**If it fails**:
- Click "🔄 Refresh Pool" button to manually sync
- Check backend logs for broadcast failures
- Verify MetaMask transaction succeeded

---

### Test 3: Weapon Launch - Battle Updates
**Goal**: Verify all players see weapon effects in real-time

**Steps**:
1. Continue from Test 2 (after delegation complete)
2. **Browser 2 (member)**: Watch enemy health bars
3. **Browser 1 (leader)**: Click any weapon (e.g., "Molotov Cocktail")
4. **Do NOT approve any MetaMask popup** (it's gasless!)

**Expected Result**:
- ✅ Both browsers see:
  - Enemy health decrease
  - Team pool decrease
  - Transaction appear in history
  - Attack animation
- ✅ All updates happen **immediately** without refresh
- ✅ Backend logs show: "💥 War weapon launch" and "📢 Broadcast complete: 2 sent, 0 failed"

**If it fails**:
- Check if delegation was successful (Test 2)
- Look for "❌ No active members with funds" in backend logs
- Verify both WebSockets are connected

---

## 🔍 Debugging

### Check Backend Logs
Open a terminal and run:
```bash
# Windows
Get-Content backend\server.log -Tail 50 -Wait

# Or check the process output in Kiro
```

Look for:
- ✅ "📢 Broadcast complete: X sent, 0 failed" = Good!
- ❌ "📢 Broadcast complete: X sent, Y failed" = Problem!
- ❌ "NO WEBSOCKET STORED" = Connection issue
- ❌ "WebSocket state: 0" = Still connecting
- ❌ "WebSocket state: 3" = Connection closed

### Check Frontend Console
Press F12 in browser, go to Console tab

Look for:
- ✅ "📨 Received PLAYER_JOINED:" = Message received
- ✅ "📨 Received WAR_DELEGATION_UPDATED:" = Delegation update received
- ✅ "📨 Received WAR_WEAPON_LAUNCHED:" = Weapon update received
- ❌ "WebSocket error" = Connection problem
- ❌ No messages = Not receiving broadcasts

### Common Issues

**Issue**: Host doesn't see new player
- **Solution**: Check if both WebSockets are OPEN (state = 1)
- **Workaround**: Refresh host's browser after player joins

**Issue**: Team pool doesn't update
- **Solution**: Click "🔄 Refresh Pool" button
- **Check**: Verify delegation transaction succeeded on blockchain
- **Verify**: Click "🔍 Verify Delegations" to check on-chain status

**Issue**: Weapon launch doesn't show
- **Solution**: Ensure team member delegated first
- **Check**: Backend logs for "❌ No active members with funds"
- **Verify**: Team pool shows > 0 MNT before launching

---

## 📊 Success Criteria

All tests pass if:
1. ✅ Host sees new players join without refresh
2. ✅ Team leader sees pool increase when members delegate
3. ✅ All players see weapon launches in real-time
4. ✅ Backend logs show "0 failed" for all broadcasts
5. ✅ No manual refresh needed for any updates

---

## 🛠️ If Tests Fail

### Step 1: Restart Backend
```bash
# Stop backend (Ctrl+C in terminal)
cd backend
node server.js
```

### Step 2: Clear Browser Cache
- Press Ctrl+Shift+Delete
- Clear cache and cookies
- Refresh page

### Step 3: Check Ports
- Backend should be on port 3001
- WebSocket should be on port 8081
- Frontend should be on port 3002

### Step 4: Check Wallet Connection
- Ensure MetaMask is connected
- Switch to Mantle Sepolia network
- Have some MNT for gas (backend pays, but wallet needs to be connected)

---

## 📝 Report Issues

If auto-refresh still doesn't work after fixes:

1. Copy backend logs showing the broadcast failure
2. Copy frontend console showing missing messages
3. Note which test scenario failed
4. Check AUTO_REFRESH_FIX.md for detailed debugging steps

---

## ✅ Current Status

**Fixed Issues**:
- ✅ Enhanced WebSocket connection tracking
- ✅ Added 100ms delay before broadcasts
- ✅ Improved error logging and debugging
- ✅ Better WebSocket state validation

**Known Limitations**:
- ⚠️ If connection drops, player must refresh
- ⚠️ Multiple tabs with same wallet may conflict
- ⚠️ Slow networks may need longer delays

**Next Improvements** (if needed):
- Add automatic reconnection
- Implement message acknowledgments
- Add connection health monitoring
- Queue messages for offline players
