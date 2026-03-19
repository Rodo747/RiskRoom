import React from "react";
import { C, FONT } from "./theme.js";

// Text color tokens
const t1 = C.t1 || "#E6EDF3";
const t2 = C.t2 || "#A8B3C2";
const t3 = C.t3 || "#6B7A8D";
const red = C.red || "#E53935";
const border = C.border || "#1F2A36";
const teal = C.teal || "#00C9A0";

// Type scale configuration
const TS = {
  pageTitle:  28,
  pageSub:    14,
  eyebrow:    12,
  heroName:   32,
  heroRole:   14,
  missionBody:16,
  statValue:  28,
  statLabel:  12,
  sectionHd:  12,
  techLabel:  12,
  techValue:  15,
  agentName:  15,
  agentModel: 12,
  agentDesc:  14,
  capTag:     13,
};

// Section label component
const SectionLabel = ({ children, accent }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
    <div style={{ width: 2, height: 11, borderRadius: 1, background: accent || t3 }} />
    <span style={{
      fontSize: TS.sectionHd, fontWeight: 700,
      letterSpacing: "0.16em", textTransform: "uppercase",
      color: t3, fontFamily: FONT,
    }}>
      {children}
    </span>
  </div>
);

// Card component
const Card = ({ children, style = {} }) => (
  <div style={{
    background: C.panel || "#121821",
    border: `1px solid ${C.border || "#1F2A36"}`,
    borderRadius: 8,
    padding: "14px 16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
    ...style,
  }}>
    {children}
  </div>
);

// AI Agent data
const agents = [
  { name: "Data Ingestion Agent",         model: "Haiku 3.5",  role: "Extracts info from uploaded PDF and company context. Structures product data for the pipeline.", tools: "Document Parser", tier: "base" },
  { name: "Orchestrator Agent",           model: "Sonnet 3.7", role: "Coordinates the full agent workflow. Prepares Monte Carlo simulation parameters and distributes tasks.", tools: "-", tier: "core" },
  { name: "Market Intelligence Agent",    model: "Haiku 3.5",  role: "Analyzes market size, sector trends, consumer demand and growth opportunities in the target region.", tools: "Brave Search", tier: "base" },
  { name: "Competitor Adversary Agent",   model: "Haiku 3.5",  role: "Identifies competitors, analyzes pricing strategies, simulates competitive reactions and vulnerabilities.", tools: "Brave Search", tier: "base" },
  { name: "Regulatory Risk Agent",        model: "Haiku 3.5",  role: "Researches regulations, certifications (FDA, CE), compliance costs and legal barriers in target market.", tools: "Brave Search", tier: "base" },
  { name: "Pricing Optimizer",            model: "Haiku 3.5",  role: "Calculates optimal pricing strategy based on market data, elasticity and competitive positioning.", tools: "-", tier: "base" },
  { name: "Risk Analyst",                 model: "Sonnet 3.7", role: "Synthesizes all agent outputs + Monte Carlo results. Issues executive risk classification and Go/No-Go.", tools: "-", tier: "core" },
  { name: "Mitigation Strategist Agent",  model: "Haiku 3.5", role: "Designs top 3 risk mitigation actions with cost and ROI estimates. Delivers 90-day contingency plan.", tools: "-", tier: "base" },
  { name: "Multi-channel Output Agent",   model: "Haiku 3.5",  role: "Sends final report via Email, Slack notification and uploads to Google Drive on executive approval.", tools: "Email / Slack / Drive", tier: "base" },
];

// Tech stack data
const techStack = [
  ["Frontend",    "React + Recharts"],
  ["Backend",     "Python + FastAPI"],
  ["Simulation",  "NumPy Monte Carlo"],
  ["AI Pipeline", "Airia Agents"],
  ["LLM",         "Claude 3.7 Sonnet"],
  ["Web Search",  "Brave MCP"],
  ["Deploy",      "Railway + Vercel"],
  ["Database",    "PostgreSQL"],
];

// Capabilities data
const capabilities = [
  "Monte Carlo", "Multi-Agent", "HITL", "PDF Reports",
  "Web Search", "Real-time Data", "Risk Scoring", "Go/No-Go",
];

// Main Info page component
export default function InfoPage() {
  const bg = C.bg || "#0B0F14";
  const border = C.border || "#1F2A36";
  const panel = C.panel || "#121821";
  const bg2 = C.bg2 || "#0F141A";
  const red = C.red || "#E53935";
  const teal = C.teal || "#00C9A0";
  const tealBrt = C.tealBrt || "#00E5A8";

  return (
    <div style={{
      width: "100%",
      height: "calc(100vh - 52px)",
      overflowY: "auto",
      padding: "18px 22px",
      background: bg,
      fontFamily: FONT,
      boxSizing: "border-box",
    }}>

      {/* Page header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: TS.pageTitle, fontWeight: 800, color: t1, letterSpacing: "-0.01em" }}>
          RISK<span style={{ color: red }}>ROOM</span>
        </div>
        <div style={{ fontSize: TS.pageSub, color: t3, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 2 }}>
          Probabilistic Strategic Simulation
        </div>
      </div>

      {/* Row 1: Hero cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 12, marginBottom: 12 }}>

        {/* Developer card */}
        <div style={{
          background: "#0D1117",
          border: `1px solid ${border}`,
          borderLeft: `3px solid ${red}`,
          borderRadius: 8,
          padding: "24px 22px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minHeight: 200,
          boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
        }}>
          {/* Eyebrow — muted uppercase */}
          <div style={{
            fontSize: TS.eyebrow, color: t3,
            letterSpacing: "0.18em", textTransform: "uppercase",
            fontWeight: 700, marginBottom: 10, fontFamily: FONT,
          }}>
            Developer
          </div>

          {/* Name — T1 white, large, dominant */}
          <div style={{
            fontSize: TS.heroName, fontWeight: 800,
            color: t1, lineHeight: 1.2,
            letterSpacing: "-0.02em", marginBottom: 8,
          }}>
            Rodolfo Melvin<br />Soliz Barrientos
          </div>

          {/* Role — red accent, only use of color on this card */}
          <div style={{
            fontSize: TS.heroRole, color: red,
            fontWeight: 600, letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
            Lead Interaction Architect & Developer
          </div>

          {/* Subtle divider */}
          <div style={{
            marginTop: 20, paddingTop: 14,
            borderTop: `1px solid ${border}`,
          }}>
          </div>
        </div>

        {/* Mission card */}
        <div style={{
          background: "#0D1117",
          border: `1px solid ${border}`,
          borderTop: `2px solid ${C.border2 || "#263445"}`,
          borderRadius: 8,
          padding: "24px 22px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: 200,
          boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
        }}>
          <div>
            <div style={{
              fontSize: TS.eyebrow, color: t3,
              letterSpacing: "0.18em", textTransform: "uppercase",
              fontWeight: 700, marginBottom: 12, fontFamily: FONT,
            }}>
              Mission
            </div>

            <p style={{ fontSize: TS.missionBody, color: t2, lineHeight: 1.85, margin: "0 0 8px 0" }}>
              RiskRoom is an internal corporate tool for{" "}
              <span style={{ color: t1, fontWeight: 600 }}>probabilistic strategic simulation</span>{" "}
              before launching a product into international markets. It combines Monte Carlo simulation,
              multi-agent AI orchestration, and real-time market data to{" "}
              <span style={{ color: red, fontWeight: 600 }}>quantify risk before it's too late</span>.
            </p>
            <p style={{ fontSize: TS.missionBody, color: t2, lineHeight: 1.85, margin: 0 }}>
              RiskRoom doesn't predict the future - it models{" "}
              <span style={{ color: t1, fontWeight: 600 }}>500 possible futures</span>{" "}
              so executives make better decisions with real data instead of gut instinct.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 18 }}>
            {[
              { v: "500",  l: "Monte Carlo Runs" },
              { v: "9",    l: "AI Agents"        },
              { v: "24/7", l: "Real-time Data"   },
            ].map(s => (
              <div key={s.l} style={{
                background: bg2,
                border: `1px solid ${border}`,
                borderBottom: `2px solid ${tealBrt}`,
                borderRadius: 5,
                padding: "10px 12px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: TS.statValue, fontWeight: 800, color: t1, fontFamily: FONT, lineHeight: 1 }}>
                  {s.v}
                </div>
                <div style={{ fontSize: TS.statLabel, color: t3, marginTop: 5, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: FONT, fontWeight: 600 }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Capabilities strip */}
      <div style={{
        marginBottom: 12,
        padding: "12px 16px",
        background: panel,
        border: `1px solid ${border}`,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}>
        <span style={{
          fontSize: TS.eyebrow, color: t3,
          letterSpacing: "0.16em", textTransform: "uppercase",
          fontWeight: 700, fontFamily: FONT, flexShrink: 0,
          marginRight: 4,
        }}>
          Capabilities
        </span>
        <div style={{ width: 1, height: 14, background: border, flexShrink: 0 }} />
        {capabilities.map(tag => (
          <span key={tag} style={{
            fontSize: TS.capTag,
            padding: "3px 10px",
            background: "transparent",
            border: `1px solid ${border}`,
            color: t2,
            borderRadius: 3,
            letterSpacing: "0.04em",
            fontFamily: FONT,
            fontWeight: 500,
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Row 3: Tech Stack and Agent Pipeline */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 12 }}>

        {/* Tech Stack */}
        <Card>
          <SectionLabel>Tech Stack</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {techStack.map(([layer, tech]) => (
              <div key={layer} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
                borderBottom: `1px solid ${border}`,
              }}>
                <span style={{ fontSize: TS.techLabel, color: t3, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, fontFamily: FONT }}>
                  {layer}
                </span>
                <span style={{ fontSize: TS.techValue, color: t1, fontWeight: 600, fontFamily: FONT }}>
                  {tech}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Agent Pipeline */}
        <Card>
          <SectionLabel accent={teal}>
            Airia Agent Pipeline - 9 Specialized AI Agents
          </SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 6 }}>
            {agents.map((a, i) => (
              <div key={i} style={{
                display: "flex",
                gap: 9,
                alignItems: "flex-start",
                background: bg2,
                border: `1px solid ${border}`,
                borderLeft: `2px solid ${a.tier === "core" ? red : C.border2 || "#263445"}`,
                borderRadius: 5,
                padding: "9px 11px",
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: a.tier === "core" ? `${red}15` : `${border}`,
                  border: `1px solid ${a.tier === "core" ? red + "40" : C.border2 || "#263445"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: a.tier === "core" ? red : t3,
                  fontWeight: 700, flexShrink: 0, marginTop: 1, fontFamily: FONT,
                }}>
                  {i + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: TS.agentName, color: t1, fontWeight: 600, fontFamily: FONT }}>
                      {a.name}
                    </span>
                    <span style={{
                      fontSize: TS.agentModel,
                      padding: "1px 6px",
                      border: `1px solid ${a.model.includes("Sonnet") ? red + "40" : border}`,
                      color: a.model.includes("Sonnet") ? red : t3,
                      borderRadius: 3,
                      letterSpacing: "0.04em",
                      fontFamily: FONT,
                      fontWeight: 600,
                    }}>
                      {a.model}
                    </span>
                    {a.tools !== "-" && (
                      <span style={{
                        fontSize: TS.agentModel,
                        padding: "1px 6px",
                        border: `1px solid ${border}`,
                        color: t3,
                        borderRadius: 3,
                        letterSpacing: "0.04em",
                        fontFamily: FONT,
                        fontWeight: 500,
                      }}>
                        {a.tools}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: TS.agentDesc, color: t2, lineHeight: 1.6, fontFamily: FONT }}>
                    {a.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
