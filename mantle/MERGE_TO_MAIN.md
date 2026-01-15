# How to Merge Voting Fix to Main Branch

## Current Status
✅ The voting fix has been committed to the `envio` branch
✅ Changes have been pushed to GitHub

## Changes Made
- Fixed `backend/server.js` - WebSocket address normalization
- Added `VOTING_UI_FIX.md` - Detailed documentation
- Added `VOTING_FIX_SUMMARY.md` - Quick reference

## To Merge to Main Branch

### Option 1: Via GitHub (Recommended)
1. Go to https://github.com/krish2413179-prog/mantle
2. Click "Pull requests" → "New pull request"
3. Set base: `main`, compare: `envio`
4. Review changes (should show only the 3 files above)
5. Click "Create pull request"
6. Click "Merge pull request"

### Option 2: Via Command Line
```bash
# Stash PayOnly changes (they're blocking the merge)
git stash push -m "PayOnly changes" -- ../PayOnly/*

# Switch to main
git checkout main

# Pull latest
git pull origin main

# Merge envio
git merge envio

# Push to main
git push origin main

# Restore PayOnly changes if needed
git stash pop
```

## What Gets Deployed
Once merged to main, Render will automatically:
1. Detect the changes in `backend/server.js`
2. Rebuild the backend service
3. Deploy the new version with the voting fix

## Testing After Deployment
1. Start a multiplayer war battle with 2+ players
2. Have one player propose a weapon vote
3. **All players should see the voting UI immediately**
4. Check Render logs for broadcast messages

## Render Logs to Watch For
```
📢 Broadcasting to war battle: WAR_VOTE_STARTED
📊 Battle has 3 team members, 3 WebSocket connections
  ✅ Sent to Player1
  ✅ Sent to Player2
  ✅ Sent to Player3
📢 Broadcast complete: 3 sent, 0 failed
```

If you see "NO WEBSOCKET STORED" errors, it means players haven't connected yet.
