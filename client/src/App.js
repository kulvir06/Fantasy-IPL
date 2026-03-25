import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Fixtures from "./pages/Fixtures";
import Leaderboard from "./pages/Leaderboard";
import MyPredictions from "./pages/MyPredictions";
import ModeratorPanel from "./pages/ModeratorPanel";

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ipl_user")) || null; } catch { return null; }
  });
  const [tab, setTab] = useState("fixtures");

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("ipl_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("ipl_user");
    setTab("fixtures");
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const tabs = [
    { id: "fixtures", label: "🏏 Fixtures" },
    { id: "leaderboard", label: "🏆 Leaderboard" },
    { id: "my", label: "📋 My Predictions" },
    ...(user.isModerator ? [{ id: "mod", label: "⚙️ Moderator" }] : []),
  ];

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">IPL FANTASY 2026</div>
        <div className="nav-user">
          <span className="nav-name">👤 <span>{user.name}</span></span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="page">
        {tab === "fixtures" && <Fixtures user={user} />}
        {tab === "leaderboard" && <Leaderboard />}
        {tab === "my" && <MyPredictions user={user} />}
        {tab === "mod" && user.isModerator && <ModeratorPanel />}
      </div>
    </div>
  );
}
