import { useState, useEffect } from "react";

export default function ModeratorPanel() {
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

  const handleResult = async (matchNo, team1, team2) => {
    const f = form[matchNo] || {};
    if (!f.winner || !f.mom) return setMsg({ ...msg, [matchNo]: "Fill both winner and MoM." });
    try {
      const res = await fetch("/api/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchNo, actualWinner: f.winner, actualMOM: f.mom }),
      });
      const data = await res.json();
      if (!res.ok) setMsg({ ...msg, [matchNo]: data.error });
      else {
        setMsg({ ...msg, [matchNo]: "✅ Result saved and scores updated!" });
        fetchAll();
      }
    } catch { setMsg({ ...msg, [matchNo]: "Server error." }); }
  };

  const submittedCount = (matchNo) =>
    predictions.filter((p) => parseInt(p.MatchNo) === matchNo && p.SubmittedAt && p.SubmittedAt !== "").length;

  if (loading) return <div className="loading">Loading...</div>;

  const upcoming = fixtures.filter((f) => f.Status === "UPCOMING");
  const completed = fixtures.filter((f) => f.Status === "COMPLETED");

  return (
    <div>
      <div className="section-title">⚙️ <span>Moderator Panel</span></div>
      <p style={{ color: "var(--text-muted)", marginBottom: 28, fontSize: 14 }}>
        After each match ends, enter the actual winner and Man of the Match below. Scores will be auto-calculated and the Excel file updated.
      </p>

      <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 1 }}>
        ⏳ Upcoming Matches
      </div>
      {upcoming.map((fx) => {
        const matchNo = parseInt(fx.MatchNo);
        const submitted = submittedCount(matchNo);
        return (
          <div key={matchNo} className="mod-card">
            <h3>M{matchNo}: {fx.Team1} vs {fx.Team2}</h3>
            <div className="mod-sub">{fx.Date} · {fx.Venue} · {submitted}/9 predictions submitted</div>
            <div className="result-row">
              <select
                className="select-input"
                value={form[matchNo]?.winner || ""}
                onChange={(e) => setForm({ ...form, [matchNo]: { ...form[matchNo], winner: e.target.value } })}
              >
                <option value="">Select Winner</option>
                <option value={fx.Team1}>{fx.Team1}</option>
                <option value={fx.Team2}>{fx.Team2}</option>
              </select>
              <input
                className="text-input"
                placeholder="Man of the Match (player name)"
                value={form[matchNo]?.mom || ""}
                onChange={(e) => setForm({ ...form, [matchNo]: { ...form[matchNo], mom: e.target.value } })}
              />
              <button className="btn-result" onClick={() => handleResult(matchNo, fx.Team1, fx.Team2)}>
                Save Result ✓
              </button>
            </div>
            {msg[matchNo] && (
              <div className={msg[matchNo].startsWith("✅") ? "success-msg" : "error-msg"} style={{ marginTop: 10 }}>
                {msg[matchNo]}
              </div>
            )}
          </div>
        );
      })}

      {completed.length > 0 && (
        <>
          <div style={{ marginTop: 28, marginBottom: 8, fontSize: 13, fontWeight: 600, color: "var(--green)", textTransform: "uppercase", letterSpacing: 1 }}>
            ✅ Completed Matches
          </div>
          {completed.map((fx) => (
            <div key={fx.MatchNo} className="mod-card" style={{ opacity: 0.7 }}>
              <h3>M{fx.MatchNo}: {fx.Team1} vs {fx.Team2}</h3>
              <div className="mod-sub">
                Winner: <strong style={{ color: "var(--green)" }}>{fx.ActualWinner}</strong>
                &nbsp;·&nbsp; MoM: <strong style={{ color: "var(--blue)" }}>{fx.ActualMOM}</strong>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
