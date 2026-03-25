import { useState, useEffect } from "react";

export default function Leaderboard() {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => { setBoard(d); setLoading(false); });
  }, []);

  if (loading) return <div className="loading">Loading leaderboard...</div>;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div>
      <div className="section-title">🏆 <span>Leaderboard</span></div>
      {board.length === 0 ? (
        <div className="empty">No scores yet. Game starts soon!</div>
      ) : (
        <div className="leaderboard">
          {board.map((p, i) => (
            <div key={p.name} className={`lb-row rank-${i + 1}`}>
              <div className="lb-rank">{medals[i] || i + 1}</div>
              <div className="lb-name">{p.name}</div>
              <div className="lb-stats">
                <div className="lb-stat">
                  <div className="lb-stat-val">{p.total}</div>
                  <div className="lb-stat-label">Total Pts</div>
                </div>
                <div className="lb-stat">
                  <div className="lb-stat-val green">{p.winnerHits}</div>
                  <div className="lb-stat-label">Winner Hits</div>
                </div>
                <div className="lb-stat">
                  <div className="lb-stat-val blue">{p.momHits}</div>
                  <div className="lb-stat-label">MoM Hits</div>
                </div>
                <div className="lb-stat">
                  <div className="lb-stat-val" style={{ color: "var(--text-muted)" }}>{p.played}</div>
                  <div className="lb-stat-label">Predictions</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
