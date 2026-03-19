import React, { useState } from "react";
import { C, FONT } from "./theme.js";
import { Glows, Input, Btn } from "./components.jsx";

// Type scale configuration
const TS = {
  logoTitle:   38,
  logoSub:     13,
  tabLabel:    12,
  demoLabel:   11,
  demoValue:   13,
  dividerText: 12,
  footerText:  11,
  errorText:   12,
};

// Text color tokens
const t1 = C.t1 || "#E6EDF3";
const t2 = C.t2 || "#A8B3C2";
const t3 = C.t3 || "#6B7A8D";

// Login page component
export default function LoginPage({ onLogin }) {
  const [mode,     setMode]     = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [company,  setCompany]  = useState("");
  const [sector,   setSector]   = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // Handle login authentication
  const handleLogin = async () => {
    if (!email || !password) { setError("Enter email and password."); return; }
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 700));
    if (email === "demo@riskroom.ai" && password === "demo1234") {
      onLogin({ email, company: "DEMO CORP", sector: "Technology", isDemo: true });
    } else {
      const users = JSON.parse(localStorage.getItem("rr_users") || "[]");
      const user  = users.find(u => u.email === email && u.password === password);
      if (user) { onLogin(user); }
      else { setError("Invalid credentials."); setLoading(false); }
    }
  };

  // Handle new user registration
  const handleRegister = async () => {
    if (!email || !password || !company) { setError("All fields are required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 500));
    const users = JSON.parse(localStorage.getItem("rr_users") || "[]");
    if (users.find(u => u.email === email)) { setError("Email already registered."); setLoading(false); return; }
    const newUser = { email, password, company, sector: sector || "General", isDemo: false };
    users.push(newUser);
    localStorage.setItem("rr_users", JSON.stringify(users));
    onLogin(newUser);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONT,
      position: "relative",
      overflow: "hidden",
    }}>
      <Glows />

      {/* Grid lines background */}
      <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.18 }}>
        {[100,200,300,400,500,600,700,800].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="100%" stroke={C.border} strokeWidth="0.5" />
        ))}
        {[80,160,240,320,400,480,560,640].map(y => (
          <line key={y} x1="0" y1={y} x2="100%" y2={y} stroke={C.border} strokeWidth="0.5" />
        ))}
      </svg>

      <div style={{ position: "relative", zIndex: 5, width: "100%", maxWidth: 420, padding: "0 20px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 8 }}>
            {/* Brand accent bars */}
            <div style={{ display: "flex", gap: 3 }}>
              <div style={{ width: 3, height: 24, background: `linear-gradient(180deg,${C.red},${C.redDeep})`, borderRadius: 1 }} />
              <div style={{ width: 3, height: 24, background: `linear-gradient(180deg,${C.teal},${C.tealDeep})`, borderRadius: 1 }} />
            </div>
            <span style={{ fontSize: TS.logoTitle, fontWeight: 700, letterSpacing: "0.08em", fontFamily: FONT, color: C.t1 }}>
              RISK<span style={{ color: C.red }}>ROOM</span>
            </span>
          </div>
          <div style={{ fontSize: TS.logoSub, color: C.t3, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: FONT }}>
            Strategic Decisions / Quantified
          </div>
        </div>

        {/* Login card */}
        <div style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: "26px 28px",
          boxShadow: "0 4px 40px rgba(0,0,0,0.5)",
        }}>

          {/* Tab switcher */}
          <div style={{ display: "flex", marginBottom: 22, background: C.bg2, borderRadius: 6, padding: 3 }}>
            {[{ key: "login", label: "Sign In" }, { key: "register", label: "Register" }].map(t => (
              <button
                key={t.key}
                onClick={() => { setMode(t.key); setError(""); }}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  background: mode === t.key ? C.panel : "transparent",
                  border: `1px solid ${mode === t.key ? C.border : "transparent"}`,
                  borderRadius: 4,
                  color: mode === t.key ? C.t1 : C.t2,
                  fontSize: TS.tabLabel,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: FONT,
                  fontWeight: mode === t.key ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {mode === "login" ? (
            <div>
              <Input label="Email"    type="email"    value={email}    onChange={e => setEmail(e.target.value)}    placeholder="your@company.com" />
              <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="........" />

              {/* Error message */}
              {error && (
                <div style={{ color: C.red, fontSize: TS.errorText, marginBottom: 12, fontFamily: FONT }}>
                  {error}
                </div>
              )}

              <Btn onClick={handleLogin} disabled={loading} variant="teal">
                {loading ? "Authenticating..." : "Sign In"}
              </Btn>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontSize: TS.dividerText, color: C.t2, letterSpacing: "0.12em" }}>OR</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>

              <Btn
                onClick={() => onLogin({ email: "demo@riskroom.ai", company: "DEMO CORP", sector: "Technology", isDemo: true })}
                variant="ghost"
              >
                Use Demo Credentials
              </Btn>

              {/* Demo credentials box */}
              <div style={{
                marginTop: 12,
                padding: "10px 14px",
                background: C.bg2,
                border: `1px solid ${C.border}`,
                borderRadius: 5,
              }}>
                <div style={{ fontSize: TS.demoLabel, color: C.t3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5, fontFamily: FONT, fontWeight: 600 }}>
                  Demo Access
                </div>
                <div style={{ fontSize: TS.demoValue, color: C.t2, fontFamily: FONT, marginBottom: 2 }}>
                  Email: <span style={{ color: C.teal, fontWeight: 600 }}>demo@riskroom.ai</span>
                </div>
                <div style={{ fontSize: TS.demoValue, color: C.t2, fontFamily: FONT }}>
                  Password: <span style={{ color: C.teal, fontWeight: 600 }}>demo1234</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Input label="Company Name" value={company}  onChange={e => setCompany(e.target.value)}  placeholder="Your Company Inc." />
              <Input label="Sector"       value={sector}   onChange={e => setSector(e.target.value)}   placeholder="Technology / Retail / Finance..." />
              <Input label="Email"    type="email"    value={email}    onChange={e => setEmail(e.target.value)}    placeholder="your@company.com" />
              <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" />
              {error && (
                <div style={{ color: C.red, fontSize: TS.errorText, marginBottom: 12, fontFamily: FONT }}>
                  {error}
                </div>
              )}
              <Btn onClick={handleRegister} disabled={loading} variant="teal">
                {loading ? "Creating Account..." : "Create Account"}
              </Btn>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <div style={{ fontSize: TS.footerText, color: C.t3, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: FONT }}>
            RiskRoom v1.0 - Airia AI Agents Hackathon - 2026
          </div>
        </div>
      </div>
    </div>
  );
}
