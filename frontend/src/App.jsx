import React, { useState, useEffect } from "react";
import { C, FONT } from "./theme.js";
import LoginPage    from "./LoginPage.jsx";
import AnalysisPage from "./AnalysisPage.jsx";
import ResultsPage  from "./ResultsPage.jsx";
import ReportsPage  from "./ReportsPage.jsx";
import CompanyPage  from "./CompanyPage.jsx";
import InfoPage     from "./InfoPage.jsx";
import { Glows }    from "./components.jsx";
const Logo = "/logo.png";

// Global CSS styles for the application
const GLOBAL_STYLES = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fiu {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  .fiu { animation: fiu 0.4s ease forwards; }
  .fi  { animation: fiu 0.3s ease forwards; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; background: ${C.bg || "#0B0F14"}; }
  input, button, textarea, select { font-family: ${FONT}; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: ${C.bg || "#0B0F14"}; }
  ::-webkit-scrollbar-thumb { background: ${C.border || "#1F2A36"}; border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: ${C.grayMid || "#5F6B7A"}; }
`;

// Text hierarchy tokens
const t1 = C.t1 || "#E6EDF3";
const t2 = C.t2 || "#A8B3C2";
const t3 = C.t3 || "#6B7A8D";

// Type scale configuration
const TS = {
  navLabel:  13,
  navIcon:   16,
  logoTitle: 26,
  logoSub:   11,
  userLabel: 11,
  userName:  15,
  userEmail: 13,
  logoutBtn: 12,
};

// Navigation items
const NAV = [
  { key: "analysis", label: "Analysis", icon: "◎" },
  { key: "results",  label: "Results",  icon: "▦" },
  { key: "reports",  label: "Reports",  icon: "▤" },
  { key: "company",  label: "Company",  icon: "◈" },
  { key: "info",     label: "Info",     icon: "◉" },
];

// Sidebar component
function Sidebar({ page, onNav, user, onLogout }) {
  return (
    <div style={{
      width: 220,
      minHeight: "100vh",
      background: "rgba(9,13,18,0.98)",
      borderRight: `1px solid ${C.border}`,
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      left: 0, top: 0, bottom: 0,
      zIndex: 20,
    }}>
      {/* Top accent bar */}
      <div style={{
        height: 2,
        background: `linear-gradient(90deg, ${C.red}, ${C.teal})`,
        flexShrink: 0,
      }} />

      {/* Logo area */}
      <div style={{ padding: "20px 16px 22px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
          <img
            src={Logo}
            alt="RiskRoom Logo"
            style={{ width: 50, height: 50, objectFit: "contain", flexShrink: 0 }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Logo title */}
            <span style={{
              fontSize: TS.logoTitle,
              fontWeight: 700,
              letterSpacing: "0.04em",
              fontFamily: FONT,
              color: t1,
              lineHeight: 1.1,
            }}>
              RISK<span style={{ color: C.red }}>ROOM</span>
            </span>
            {/* Logo subtitle */}
            <span style={{
              fontSize: TS.logoSub,
              color: C.teal,
              letterSpacing: "0.14em",
              fontFamily: FONT,
              marginTop: 2,
              textTransform: "uppercase",
            }}>
              Strategic Decisions
            </span>
          </div>
        </div>
      </div>

      {/* Navigation items */}
      <nav style={{ flex: 1, padding: "0 10px", overflowY: "auto" }}>
        {NAV.map(item => {
          const active = page === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNav(item.key)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                marginBottom: 3,
                background: active ? "rgba(18,24,33,0.95)" : "transparent",
                border: active ? `1px solid ${C.teal}30` : "1px solid transparent",
                borderLeft: active ? `2px solid ${C.red}` : "2px solid transparent",
                borderRadius: 6,
                color: active ? t1 : t2,
                cursor: "pointer",
                fontFamily: FONT,
                textAlign: "left",
                transition: "all 0.15s",
                outline: "none",
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.color = t1;
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = t2;
                }
              }}
            >
              {/* Navigation icon */}
              <div style={{
                width: 30,
                height: 30,
                borderRadius: 6,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: active
                  ? `linear-gradient(135deg, ${C.teal}CC, ${C.teal})`
                  : "rgba(255,255,255,0.04)",
                border: active ? "none" : `1px solid ${C.border}`,
                transition: "all 0.15s",
              }}>
                <span style={{
                  fontSize: TS.navIcon,
                  color: t1,
                  opacity: active ? 1 : 0.4,
                  lineHeight: 1,
                }}>
                  {item.icon}
                </span>
              </div>

              {/* Navigation label */}
              <span style={{
                fontSize: TS.navLabel,
                fontWeight: active ? 600 : 400,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* User info and logout footer */}
      <div style={{
        padding: "12px 14px",
        borderTop: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        {/* Logged in caption */}
        <div style={{
          fontSize: TS.userLabel,
          color: t3,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 4,
          fontFamily: FONT,
          fontWeight: 600,
        }}>
          Logged In
        </div>

        {/* Company name */}
        <div style={{
          fontSize: TS.userName,
          color: t1,
          fontWeight: 600,
          marginBottom: 2,
          fontFamily: FONT,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {user?.company || "DEMO CORP"}
        </div>

        {/* User email */}
        <div style={{
          fontSize: TS.userEmail,
          color: t2,
          marginBottom: 10,
          fontFamily: FONT,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {user?.email}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Online indicator */}
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <div style={{
              width: 6, height: 6,
              borderRadius: "50%",
              background: C.teal,
              boxShadow: `0 0 5px ${C.teal}`,
            }} />
            <span style={{ fontSize: 10, color: t3, fontFamily: FONT, letterSpacing: "0.06em" }}>
              ONLINE
            </span>
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              color: t2,
              fontSize: TS.logoutBtn,
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: FONT,
              letterSpacing: "0.06em",
              fontWeight: 500,
              transition: "all 0.15s",
              outline: "none",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = C.teal + "60";
              e.currentTarget.style.color = C.teal;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = t2;
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

// Main application component
export default function App() {
  const [user,    setUser]    = useState(null);
  const [page,    setPage]    = useState("analysis");
  const [simData, setSimData] = useState(null);

  // Restore last simulation from localStorage on mount
  useEffect(() => {
    const s = localStorage.getItem("rr_last_sim");
    if (s) { try { setSimData(JSON.parse(s)); } catch {} }
  }, []);

  // Handle simulation results
  const handleSim = (d) => {
    setSimData(d);
    localStorage.setItem("rr_last_sim", JSON.stringify(d));
    setPage("results");
  };

  // Login screen when no user
  if (!user) return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <LoginPage onLogin={u => { setUser(u); setPage("analysis"); }} />
    </>
  );

  // Page components mapping
  const pages = {
    analysis: <AnalysisPage user={user} onSimResult={handleSim} />,
    results:  <ResultsPage  user={user} simData={simData} onNav={setPage} />,
    reports:  <ReportsPage  user={user} />,
    company:  <CompanyPage  user={user} />,
    info:     <InfoPage />,
  };

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ minHeight: "100vh", display: "flex", position: "relative", overflow: "hidden" }}>
        <Glows />
        <Sidebar page={page} onNav={setPage} user={user} onLogout={() => setUser(null)} />
        <main style={{ marginLeft: 220, flex: 1, position: "relative", zIndex: 5 }}>
          {pages[page] || pages.analysis}
        </main>
      </div>
    </>
  );
}
