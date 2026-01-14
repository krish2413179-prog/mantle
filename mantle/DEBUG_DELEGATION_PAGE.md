# 🐛 Debug: Delegation Page Not Showing

## Issue
Teammate is not seeing the "Delegate 0.1 MNT" button/page.

## What Should Happen
When a **non-leader** team member enters the battle, they should see a full-screen **DelegationPage** with:
- Team leader info
- "Delegate 0.1 MNT" button
- Wallet status check
- Security information

## Debug Steps

### Step 1: Check Browser Console (F12)

**Teammate should open browser console and look for these logs:**

```
🎮 Initializing battle...
👤 Current user: 0xCb188D3DBAb64D9B01c6B49193F76d762a00f268
👑 Team leader will be: 0x24c80f19649c0Da8418011eF0B6Ed3e22007758c
📦 Battle data received: {...}
🎮 Battle initialized for user: 0xCb188D3DBAb64D9B01c6B49193F76d762a00f268
👤 User member data: {...}
👑 Is team leader? false
💰 Delegated amount: 0
🔍 Should show delegation? true
🔐 User needs to delegate - showing DelegationPage
🔐 Setting battlePhase to: delegation
🔐 Setting showDelegatePrompt to: true
```

**Then during render:**
```
🎨 Rendering ImprovedWarBattle
  battlePhase: delegation
  showDelegatePrompt: true
  isLeader: false
  currentMember: {...}
  Should show DelegationPage? true
```

### Step 2: Check What You See

**If logs show "Should show DelegationPage? true" but you don't see it:**

1. **Check if page is loading:**
   - Do you see the battle arena with enemies?
   - Or do you see a loading screen?

2. **Check if DelegationPage is hidden:**
   - Press F12 → Elements tab
   - Search for "DelegationPage" or "Delegate 0.1 MNT"
   - See if element exists but is hidden

3. **Check for JavaScript errors:**
   - Look for red errors in console
   - Especially around DelegationPage component

### Step 3: Common Issues

#### Issue 1: User is detected as leader
**Console shows:**
```
👑 Is team leader? true  ❌ WRONG!
```

**Solution:**
- Backend is incorrectly marking user as leader
- Check backend logs for battle initialization
- Verify room host detection

#### Issue 2: Delegated amount is not 0
**Console shows:**
```
💰 Delegated amount: 0.1  ❌ WRONG!
```

**Solution:**
- Backend thinks user already delegated
- This is the old hardcoded value issue
- Need to restart backend or clear battle state

#### Issue 3: battlePhase stuck on 'loading'
**Console shows:**
```
🎨 Rendering ImprovedWarBattle
  battlePhase: loading  ❌ STUCK!
```

**Solution:**
- Battle initialization failed
- Check network tab for failed API calls
- Check backend is running on port 3001

#### Issue 4: showDelegatePrompt is false
**Console shows:**
```
  showDelegatePrompt: false  ❌ WRONG!
```

**Solution:**
- State not updating correctly
- Try refreshing page
- Check if useEffect is running

### Step 4: Force Show Delegation Page

**If nothing works, manually trigger it in console:**

```javascript
// In browser console (F12)
// This will force show the delegation page
window.location.reload()
```

Or try this in the React DevTools:
1. Install React DevTools extension
2. Find ImprovedWarBattle component
3. Manually set state:
   - `battlePhase` → `"delegation"`
   - `showDelegatePrompt` → `true`

### Step 5: Check Backend Response

**In browser console, check the battle initialization response:**

```javascript
// Look for this in Network tab (F12 → Network)
// Find: POST http://localhost:3001/api/war-battle/initialize
// Click on it → Response tab

// Should see something like:
{
  "battleId": "war_1768379092859_0.25...",
  "battle": {
    "teamMembers": [
      {
        "address": "0x24c8...",
        "isTeamLeader": true,
        "delegatedAmount": 0,
        ...
      },
      {
        "address": "0xCb18...",  // ← This is you
        "isTeamLeader": false,   // ← Should be false
        "delegatedAmount": 0,    // ← Should be 0
        ...
      }
    ]
  }
}
```

**If your entry shows:**
- `isTeamLeader: true` → Backend issue
- `delegatedAmount: 0.1` → Backend hardcoding issue

## Quick Test

**Teammate, run this in console:**

```javascript
// Check current state
console.log('Current URL:', window.location.href)
console.log('User address:', localStorage.getItem('userAddress'))

// Check if DelegationPage component exists
const delegationPage = document.querySelector('[class*="DelegationPage"]')
console.log('DelegationPage element:', delegationPage)

// Check if button exists
const delegateButton = Array.from(document.querySelectorAll('button'))
  .find(btn => btn.textContent?.includes('Delegate'))
console.log('Delegate button:', delegateButton)
```

## Expected Behavior

### For Team Leader (Host):
- ✅ Sees battle arena immediately
- ✅ Sees weapon arsenal
- ✅ Does NOT see delegation page

### For Team Member (Non-Host):
- ✅ Sees full-screen delegation page FIRST
- ✅ Battle arena is hidden behind it
- ✅ Must delegate before seeing battle
- ✅ Can skip to watch-only mode

## If Still Not Working

**Share these details:**

1. **Console logs** (all of them from page load)
2. **Network tab** → POST /api/war-battle/initialize response
3. **Are you the host or teammate?**
4. **What do you see on screen?**
   - Loading screen?
   - Battle arena?
   - Nothing?
5. **Any JavaScript errors?**

---

**The delegation page SHOULD appear automatically for non-leader team members with 0 delegated amount.**

If logs show it should appear but doesn't, there might be a CSS/rendering issue.
