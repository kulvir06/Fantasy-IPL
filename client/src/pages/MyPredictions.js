import { useState, useEffect } from "react";

export default function MyPredictions({ user }) {
  const [fixtures, setFixtures] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("/api/fixtures"), fetch("/api/predictions")])
      .then(([f, p]) => Promise.all([f.json(), p.json()]))
      .then(([fx, preds]) => { setFixtures(fx); setPredictions(preds); setLoading(false); });
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  const myPreds = predictions.filter(
    (p) => p.PlayerName === user.name && p.SubmittedAt && p.SubmittedAt !== ""
  );

  const getFixture = (matchNo) => fixtures.find((f) => parseInt(f.MatchNo) === parseInt(matchNo));

  const totalPts = myPreds.reduce((s, p) => s + (parseInt(p.TotalPoints) || 0), 0);
  const winnerHits = myPreds.filter((p) => parseInt(p.WinnerPoints) > 0).length;
  const momHits = myPreds.filter((p) => parseInt(p.MOMPoints) > 0).length;

  return (
    <div>
      <div className="section-title">📋 My <span>Predictions</span></div>

      {/* Summary bar */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        {[
          { label: "Total Points", val: totalPts, color: "var(--accent)" },
          { label: "Winner Hits", val: winnerHits, color: "var(--green)" },
          { label: "MoM Hits", val: momHits, color: "var(--blue)" },
          { label: "Submitted", val: myPreds.length, color: "var(--text-muted)" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "14px 24px", textAlign: "center", flex: 1, minWidth: 120
          }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 32, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {myPreds.length === 0 ? (
        <div className="empty">No predictions submitted yet. Go to Fixtures to play!</div>
      ) : (
        myPreds.map((p) => {
          const fx = getFixture(p.MatchNo);
          const isCompleted = fx?.Status === "COMPLETED";
          const pts = parseInt(p.TotalPoints) || 0;
          return (
            <div key={p.MatchNo} className="my-pred-card">
              <div className="my-pred-header">
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>
                    Match {p.MatchNo} · {fx?.Date}
                  </div>
                  <div className="my-pred-match">{fx?.Team1} vs {fx?.Team2}</div>
                </div>
                {isCompleted && <div className="points-pill">+{pts} pts</div>}
              </div>
              <div className="my-pred-detail">
                <span>🏆 Winner: <strong>{p.PredictedWinner || "—"}</strong>
                  {isCompleted && (
                    <span style={{ color: parseInt(p.WinnerPoints) > 0 ? "var(--green)" : "var(--accent2)", marginLeft: 6 }}>
                      {parseInt(p.WinnerPoints) > 0 ? "✓ +3" : "✗ 0"}
                    </span>
                  )}
                </span>
                <span>🌟 MoM: <strong>{p.PredictedMOM || "—"}</strong>
                  {isCompleted && (
                    <span style={{ color: parseInt(p.MOMPoints) > 0 ? "var(--green)" : "var(--accent2)", marginLeft: 6 }}>
                      {parseInt(p.MOMPoints) > 0 ? "✓ +5" : "✗ 0"}
                    </span>
                  )}
                </span>
                {isCompleted && fx.ActualWinner && (
                  <span style={{ color: "var(--text-muted)" }}>
                    Actual: <strong style={{ color: "var(--text)" }}>{fx.ActualWinner}</strong> · <strong style={{ color: "var(--text)" }}>{fx.ActualMOM}</strong>
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
