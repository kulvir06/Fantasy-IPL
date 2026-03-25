const express = require("express");
const cors = require("cors");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const EXCEL_PATH = path.join(__dirname, "ipl_fantasy.xlsx");

function readWorkbook() {
  return XLSX.readFile(EXCEL_PATH);
}

function writeWorkbook(wb) {
  XLSX.writeFile(wb, EXCEL_PATH);
}

function sheetToJson(wb, sheetName) {
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

// ─── AUTH ────────────────────────────────────────────────────────────
app.post("/api/login", (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Code required" });

  const wb = readWorkbook();
  const players = sheetToJson(wb, "Players");
  const player = players.find(
    (p) => p.SecretCode?.toString().trim().toUpperCase() === code.trim().toUpperCase() && p.IsActive
  );

  if (!player) return res.status(401).json({ error: "Invalid code" });

  res.json({
    name: player.PlayerName,
    isModerator: player.PlayerName === "MODERATOR",
  });
});

// ─── FIXTURES ────────────────────────────────────────────────────────
app.get("/api/fixtures", (req, res) => {
  const wb = readWorkbook();
  const fixtures = sheetToJson(wb, "Fixtures");
  res.json(fixtures);
});

// ─── PREDICTIONS ─────────────────────────────────────────────────────
app.get("/api/predictions", (req, res) => {
  const wb = readWorkbook();
  const predictions = sheetToJson(wb, "Predictions");
  res.json(predictions);
});

app.post("/api/predictions", (req, res) => {
  const { matchNo, playerName, predictedWinner, predictedMOM } = req.body;
  if (!matchNo || !playerName || !predictedWinner || !predictedMOM) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const wb = readWorkbook();
  const ws = wb.Sheets["Predictions"];
  const predictions = sheetToJson(wb, "Predictions");

  // Find the row for this match + player
  const rowIndex = predictions.findIndex(
    (p) =>
      parseInt(p.MatchNo) === parseInt(matchNo) &&
      p.PlayerName?.toString().trim() === playerName.trim()
  );

  if (rowIndex === -1) return res.status(404).json({ error: "Prediction slot not found" });

  // Check if already submitted
  const existing = predictions[rowIndex];
  if (existing.SubmittedAt && existing.SubmittedAt !== "") {
    return res.status(409).json({ error: "Prediction already locked" });
  }

  // Check if match is still upcoming
  const fixtures = sheetToJson(wb, "Fixtures");
  const fixture = fixtures.find((f) => parseInt(f.MatchNo) === parseInt(matchNo));
  if (!fixture) return res.status(404).json({ error: "Match not found" });
  if (fixture.Status !== "UPCOMING") {
    return res.status(403).json({ error: "Match already completed — predictions locked" });
  }

  // Row in sheet is rowIndex + 2 (1-indexed + header row)
  const excelRow = rowIndex + 2;
  const now = new Date().toISOString();

  const colMap = { PredictedWinner: "C", PredictedMOM: "D", SubmittedAt: "E" };
  ws[`${colMap.PredictedWinner}${excelRow}`] = { v: predictedWinner, t: "s" };
  ws[`${colMap.PredictedMOM}${excelRow}`] = { v: predictedMOM, t: "s" };
  ws[`${colMap.SubmittedAt}${excelRow}`] = { v: now, t: "s" };

  writeWorkbook(wb);
  res.json({ success: true, message: "Prediction locked!" });
});

// ─── MODERATOR: Update result ─────────────────────────────────────────
app.post("/api/result", (req, res) => {
  const { matchNo, actualWinner, actualMOM } = req.body;
  if (!matchNo || !actualWinner || !actualMOM) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const wb = readWorkbook();

  // Update Fixtures sheet
  const fixtures = sheetToJson(wb, "Fixtures");
  const fixIndex = fixtures.findIndex((f) => parseInt(f.MatchNo) === parseInt(matchNo));
  if (fixIndex === -1) return res.status(404).json({ error: "Match not found" });

  const fixRow = fixIndex + 2;
  const wsf = wb.Sheets["Fixtures"];
  wsf[`H${fixRow}`] = { v: "COMPLETED", t: "s" };
  wsf[`I${fixRow}`] = { v: actualWinner.trim(), t: "s" };
  wsf[`J${fixRow}`] = { v: actualMOM.trim(), t: "s" };

  // Score predictions
  const wsp = wb.Sheets["Predictions"];
  const predictions = sheetToJson(wb, "Predictions");

  predictions.forEach((pred, idx) => {
    if (parseInt(pred.MatchNo) !== parseInt(matchNo)) return;
    const excelRow = idx + 2;

    const winnerCorrect =
      pred.PredictedWinner?.toString().trim().toUpperCase() === actualWinner.trim().toUpperCase();
    const momCorrect =
      pred.PredictedMOM?.toString().trim().toUpperCase() === actualMOM.trim().toUpperCase();

    const wPts = pred.PredictedWinner && pred.PredictedWinner !== "" ? (winnerCorrect ? 3 : 0) : 0;
    const mPts = pred.PredictedMOM && pred.PredictedMOM !== "" ? (momCorrect ? 5 : 0) : 0;
    const total = wPts + mPts;

    wsp[`F${excelRow}`] = { v: wPts, t: "n" };
    wsp[`G${excelRow}`] = { v: mPts, t: "n" };
    wsp[`H${excelRow}`] = { v: total, t: "n" };
  });

  writeWorkbook(wb);
  res.json({ success: true, message: "Result saved and scores updated!" });
});

// ─── LEADERBOARD ─────────────────────────────────────────────────────
app.get("/api/leaderboard", (req, res) => {
  const wb = readWorkbook();
  const predictions = sheetToJson(wb, "Predictions");

  const board = {};
  predictions.forEach((p) => {
    if (p.PlayerName === "MODERATOR") return;
    if (!board[p.PlayerName]) {
      board[p.PlayerName] = { name: p.PlayerName, total: 0, winnerPts: 0, momPts: 0, played: 0, winnerHits: 0, momHits: 0 };
    }
    const pts = parseInt(p.TotalPoints) || 0;
    const wp = parseInt(p.WinnerPoints) || 0;
    const mp = parseInt(p.MOMPoints) || 0;
    board[p.PlayerName].total += pts;
    board[p.PlayerName].winnerPts += wp;
    board[p.PlayerName].momPts += mp;
    if (p.SubmittedAt && p.SubmittedAt !== "") board[p.PlayerName].played += 1;
    if (wp > 0) board[p.PlayerName].winnerHits += 1;
    if (mp > 0) board[p.PlayerName].momHits += 1;
  });

  const sorted = Object.values(board).sort((a, b) => b.total - a.total);
  res.json(sorted);
});

const PORT = 3001;
app.listen(PORT, () => console.log(`🏏 IPL Fantasy Server running on http://localhost:${PORT}`));
