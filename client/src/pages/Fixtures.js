import { useState, useEffect } from "react";

const TEAMS = ["RCB", "SRH", "MI", "KKR", "RR", "CSK", "PBKS", "GT", "LSG", "DC"];

export default function Fixtures({ user }) {
  const [fixtures, setFixtures] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [fRes, pRes] = await Promise.all([fetch("/api/fixtures"), fetch("/api/predictions")]);
    const [fx, preds] = await Promise.all([fRes.json(), pRes.json()]);
    setFixtures(fx);
    setPredictions(preds);
    setLoading(false);
  };

  const myPred = (matchNo) =>
    predictions.find((p) => parseInt(p.MatchNo) === matchNo && p.PlayerName === user.name);

  const lockedPicks = (matchNo) =>
    predictions.filter((p) => parseInt(p.MatchNo) === matchNo && p.SubmittedAt && p.SubmittedAt !== "");

  const handleSubmit = async (matchNo) => {
    const f = form[matchNo] || {};
    if (!f.winner || !f.mom) return setMsg({ ...msg, [matchNo]: "Please fill both fields." });
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchNo, playerName: user.name, predictedWinner: f.winner, predictedMOM: f.mom }),
      });
      const data = await res.json();
      if (!res.ok) setMsg({ ...msg, [matchNo]: data.error });
      else {
        setMsg({ ...msg, [matchNo]: "✅ Prediction locked!" });
        fetchAll();
      }
    } catch { setMsg({ ...msg, [matchNo]: "Server error." }); }
  };

  if (loading) return <div className="loading">Loading fixtures...</div>;

  return (
    <div>
      <div className="section-title">Phase 1 <span>Fixtures</span></div>
      <div className="match-grid">
        {fixtures.map((fx) => {
          const matchNo = parseInt(fx.MatchNo);
          const isCompleted = fx.Status === "COMPLETED";
          const myP = myPred(matchNo);
          const locked = myP?.SubmittedAt && myP.SubmittedAt !== "";
          const allLocked = lockedPicks(matchNo);
          const canShowPicks = locked || isCompleted;

          return (
            <div key={matchNo} className={`match-card ${isCompleted ? "completed" : "upcoming"}`}>
              <div className="match-header">
                <div>
                  <div className="match-num">MATCH {matchNo} · {fx.Date} · {fx.Day}</div>
                  <div className="match-teams">
                    {fx.Team1} <span className="vs">vs</span> {fx.Team2}
                  </div>
                  <div className="match-meta">
                    <span>📍 {fx.Venue}</span>
                    <span>🕐 {fx.Time}</span>
                  </div>
                </div>
                <div>
                  <span className={`badge ${isCompleted ? "badge-completed" : "badge-upcoming"}`}>
                    {isCompleted ? "COMPLETED" : "UPCOMING"}
                  </span>
                  {isCompleted && fx.ActualWinner && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
                      🏆 {fx.ActualWinner} &nbsp;|&nbsp; 🌟 {fx.ActualMOM}
                    </div>
                  )}
                </div>
              </div>

              {/* Prediction form for upcoming matches */}
              {!isCompleted && !locked && (
                <div className="pred-section">
                  <h4>Your Prediction</h4>
                  <div className="pred-row">
                    <select
                      className="select-input"
                      value={form[matchNo]?.winner || ""}
                      onChange={(e) => setForm({ ...form, [matchNo]: { ...form[matchNo], winner: e.target.value } })}
                    >
                      <option value="">Select Winner</option>
                      {[fx.Team1, fx.Team2].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input
                      className="text-input"
                      placeholder="Man of the Match (player name)"
                      value={form[matchNo]?.mom || ""}
                      onChange={(e) => setForm({ ...form, [matchNo]: { ...form[matchNo], mom: e.target.value } })}
                    />
                    <button className="btn-submit" onClick={() => handleSubmit(matchNo)}>
                      Lock In 🔒
                    </button>
                  </div>
                  {msg[matchNo] && (
                    <div className={msg[matchNo].startsWith("✅") ? "success-msg" : "error-msg"}>
                      {msg[matchNo]}
                    </div>
                  )}
                </div>
              )}

              {/* Already locked */}
              {!isCompleted && locked && (
                <div className="pred-section">
                  <span className="badge badge-locked">🔒 YOUR PREDICTION LOCKED</span>
                  <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)" }}>
                    Winner: <strong style={{ color: "var(--text)" }}>{myP.PredictedWinner}</strong>
                    &nbsp;·&nbsp; MOM: <strong style={{ color: "var(--text)" }}>{myP.PredictedMOM}</strong>
                  </div>
                </div>
              )}

              {/* Show all locked picks once user has locked OR match completed */}
              {canShowPicks && allLocked.length > 0 && (
                <div className="pred-section">
                  <h4>All Picks ({allLocked.length}/9 submitted)</h4>
                  <div className="picks-grid">
                    {allLocked.map((p) => (
                      <div key={p.PlayerName} className="pick-chip">
                        <span className="pick-player">{p.PlayerName}</span>
                        <span className="pick-winner">🏆 {p.PredictedWinner}</span>
                        <span className="pick-mom">🌟 {p.PredictedMOM}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!canShowPicks && !isCompleted && (
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                  🔒 Submit your prediction to see others' picks
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
