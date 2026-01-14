# 🔧 Fix: Hardcoded Delegation Values (0.100 MNT)

## ❌ The Problem

Teammate sees:
```
Delegated: 0.100 MNT
Is Active: ✅ Yes
```

But they **never clicked any delegation button** or approved anything in MetaMask!

This means the backend is using **hardcoded mock values** instead of real player data.

## 🔍 Root Cause

The backend has two paths:

### Path 1: MULTIPLAYER (Correct) ✅
```javascript
if (currentRoom && currentRoom.players && currentRoom.players.length > 1) {
    // Use REAL players with delegatedAmount: 0
}
```

### Path 2: SINGLE PLAYER (Wrong for multiplayer) ❌
```javascript
else {
    // Use MOCK players with hardcoded delegatedAmount: 0.1
}
```

**The backend is taking Path 2 (single player) even though you're in multiplayer!**

This happens when:
- `currentRoom` is `null`
- `currentRoom.players` is `undefined`
- `currentRoom.players.length` is 1 or less

## 🔍 Debug Steps

### Step 1: Check Frontend Console

**Teammate, open console (F12) and look for:**
```
🎮 Initializing battle...
👤 Current user: 0xCb18...
👑 Team leader will be: 0x24c8...
🏠 Current room: {...}  ← CHECK THIS!
👥 Room players: [...]  ← CHECK THIS!
```

**What to look for:**
- Is `Current room` showing `null` or `undefined`? ❌ BAD
- Is `Room players` showing an array with 2+ players? ✅ GOOD
- Is `Room players` showing `undefined` or empty `[]`? ❌ BAD

### Step 2: Check Backend Terminal

**Look for:**
```
🎮 Creating MULTIPLAYER battle with real players: 2  ← GOOD!
```

**Or:**
```
🎮 Creating SINGLE PLAYER battle with mock team  ← BAD!
⚠️ WARNING: Using hardcoded delegation values for mock players!
```

**If you see "SINGLE PLAYER"**, the backend didn't receive proper room data!

## ✅ Solution

### Option 1: Pass Room Data Correctly

The issue is likely in how you're navigating to the battle. Check `page.tsx`:

<function_calls>
<invoke name="grepSearch">
<parameter name="explanation">Finding how the battle is started from the main page