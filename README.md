# 🏏 IPL Fantasy 2026 — Setup Guide

A full-stack fantasy prediction game for IPL 2026, powered by an Excel file as the database.

---

## 📁 Project Structure

```
ipl-fantasy/
├── server/
│   ├── index.js          ← Express API server
│   ├── ipl_fantasy.xlsx  ← THE MASTER DATABASE (Excel)
│   ├── create_excel.py   ← Script to regenerate the Excel
│   └── package.json
├── client/
│   ├── src/
│   │   ├── App.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Fixtures.js
│   │   │   ├── Leaderboard.js
│   │   │   ├── MyPredictions.js
│   │   │   └── ModeratorPanel.js
│   │   └── index.css
│   └── package.json
└── README.md
```

---

## 🚀 How to Run (Local)

### Step 1 — Install Dependencies

Open two terminals.

**Terminal 1 (Server):**
```bash
cd ipl-fantasy/server
npm install
```

**Terminal 2 (Client):**
```bash
cd ipl-fantasy/client
npm install
```

### Step 2 — Start the Server

```bash
cd ipl-fantasy/server
node index.js
```
You should see: `🏏 IPL Fantasy Server running on http://localhost:3001`

### Step 3 — Start the React App

```bash
cd ipl-fantasy/client
npm start
```
The browser will open at `http://localhost:3000`

---

## 🔑 Player Secret Codes

Send these codes privately to each player:

| Player    | Secret Code   |
|-----------|---------------|
| Athena    | ATHENA2026    |
| Stuti     | STUTI2026     |
| Vindhya   | VINDHYA2026   |
| Sanika    | SANIKA2026    |
| Kulvir    | KULVIR2026    |
| Himanshu  | HIMANSHU26    |
| Soham     | SOHAM2026     |
| Sahil     | SAHIL2026     |
| Vidit     | VIDIT2026     |
| **Moderator** | **MOD_IPL2026** |

> ⚠️ Change these codes in `server/ipl_fantasy.xlsx` → **Players** sheet before sharing!
> To change a code: open the Excel, edit column B for that player, save.

---

## 📊 Excel File — ipl_fantasy.xlsx

The Excel file has **3 sheets** — this is the source of truth for everything.

### Sheet 1: Players
| PlayerName | SecretCode | IsActive |
|------------|------------|----------|
| Athena | ATHENA2026 | TRUE |
| ... | ... | ... |
| MODERATOR | MOD_IPL2026 | TRUE |

**To change a code:** Edit column B and save. It takes effect immediately.
**To disable a player:** Set IsActive to FALSE.

### Sheet 2: Fixtures
| MatchNo | Date | Day | Team1 | Team2 | Venue | Time | Status | ActualWinner | ActualMOM |
|---------|------|-----|-------|-------|-------|------|--------|-------------|-----------|

- **Status**: `UPCOMING` or `COMPLETED` (auto-set by moderator)
- **ActualWinner / ActualMOM**: Filled automatically when you submit results via the web app

**To add Phase 2 fixtures:** Just add more rows to this sheet with Status = `UPCOMING`.

### Sheet 3: Predictions
| MatchNo | PlayerName | PredictedWinner | PredictedMOM | SubmittedAt | WinnerPoints | MOMPoints | TotalPoints |

- Populated automatically when players submit predictions
- Points auto-calculated when moderator submits match results

---

## 🎮 How the Game Works

### For Players:
1. Go to `http://localhost:3000`
2. Enter your secret code
3. On the **Fixtures** tab — for each upcoming match, pick:
   - The winning team (dropdown with only the 2 playing teams)
   - The Man of the Match (type any player name)
4. Click **Lock In** — your prediction is saved to Excel and **cannot be changed**
5. Once you've locked your pick, you can see what others have predicted
6. Check **My Predictions** for your score history
7. Check **Leaderboard** to see rankings

### For Moderator:
1. Login with code `MOD_IPL2026`
2. Go to **Moderator** tab
3. After each match ends, enter the actual winner + MoM and click **Save Result**
4. Scores are calculated automatically and written to Excel
5. The leaderboard updates instantly

---

## 📡 Sharing with Friends (Same Network)

If you want friends to play from their own devices (on your WiFi):
1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Tell friends to go to: `http://YOUR_LOCAL_IP:3000`
3. Make sure your firewall allows port 3000 and 3001

---

## ➕ Adding Phase 2 Fixtures (after April 12)

When BCCI releases Phase 2 schedule:
1. Open `server/ipl_fantasy.xlsx`
2. Go to **Fixtures** sheet
3. Add new rows (MatchNo 21, 22, ...) following the same format
4. Go to **Predictions** sheet
5. Add a row for each new match × each player (9 rows per match), with empty predictions
6. Save the Excel — changes are live immediately

---

## ⚙️ Changing Secret Codes

1. Open `server/ipl_fantasy.xlsx`
2. Go to **Players** sheet
3. Edit column B (SecretCode) for any player
4. Save — takes effect immediately, no server restart needed

---

## 🛠 Troubleshooting

**"Cannot connect to server"** → Make sure `node index.js` is running in the server folder

**"Invalid code"** → Check the code in the Players sheet. Codes are case-insensitive.

**Predictions not saving** → Make sure the server is running and the Excel file isn't open in Excel (Excel locks the file)

**Excel file locked** → Close Excel completely before the server tries to write to it
