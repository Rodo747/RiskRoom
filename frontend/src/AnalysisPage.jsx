import React, { useState, useCallback, useEffect, useRef } from "react";
import { C, FONT } from "./theme.js";
import { Panel, Label, Btn, AgentRow, Spinner, Slider } from "./components.jsx";
import { API_BASE } from "./config.js";

const t1 = C.t1, t2 = C.t2, t3 = C.t3;

const TS = {
  pageTitle: 34, pageSub: 16, fieldLabel: 14,
  uploadLabel: 16, uploadIcon: 34, textareaText: 15,
  toggleLabel: 15, toggleDesc: 13, previewLabel: 14,
  previewValue: 15, agentCoord: 13, runMsg: 14, errorText: 14,
};

const DEMO_PARAMS = {
  precio: 299, costo_unitario: 89, costo_logistico: 22,
  presupuesto_marketing: 650000, elasticidad: 1.6,
  agresividad_competitiva: 0.65, riesgo_regulatorio: 0.35,
  tamano_mercado_estimado: 420000,
  shock_macro: false, competitor_price_war: false,
};

const AGENT_STEPS = [
  { key: "data_ingestion", label: "Data Ingestion Agent"        },
  { key: "orchestrator",   label: "Orchestrator Agent"          },
  { key: "market",         label: "Market Intelligence Agent"   },
  { key: "competitor",     label: "Competitor Adversary Agent"  },
  { key: "regulatory",     label: "Regulatory Risk Agent"       },
  { key: "pricing",        label: "Pricing Optimizer"           },
  { key: "riskanalyst",    label: "Risk Analyst"                },
  { key: "mitigation",     label: "Mitigation Strategist"       },
  { key: "multichannel",   label: "Multi-channel Output Agent"  },
];

const IDLE = Object.fromEntries(AGENT_STEPS.map(a => [a.key, "idle"]));

const POLL_MESSAGES = [
  "Data Ingestion Agent processing inputs…",
  "Orchestrator coordinating pipeline…",
  "Market Intelligence Agent scanning web…",
  "Competitor Adversary Agent analyzing rivals…",
  "Regulatory Risk Agent checking compliance…",
  "Pricing Optimizer calculating strategy…",
  "Risk Analyst synthesizing results…",
  "Mitigation Strategist building plan…",
  "Multi-channel Output Agent generating report…",
];

export default function AnalysisPage({ user, onSimResult }) {
  const [params,      setParams]      = useState(DEMO_PARAMS);
  const [productText, setProductText] = useState("");
  const [running,     setRunning]     = useState(false);
  const [runMsg,      setRunMsg]      = useState("");
  const [agents,      setAgents]      = useState(IDLE);
  const [error,       setError]       = useState("");
  const [elapsed,     setElapsed]     = useState(0);
  const pollRef  = useRef(null);
  const timerRef = useRef(null);
  const msgIdx   = useRef(0);
  const msgTimer = useRef(null);

  const set = useCallback((n, v) => setParams(p => ({ ...p, [n]: v })), []);

  const margin    = params.precio - params.costo_unitario - params.costo_logistico;
  const marginPct = ((margin / params.precio) * 100).toFixed(1);
  const breakeven = Math.ceil(params.presupuesto_marketing / Math.max(margin, 1));

  useEffect(() => () => {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
    clearInterval(msgTimer.current);
  }, []);

  const stopAll = () => {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
    clearInterval(msgTimer.current);
  };

  const animateStep = (stepIdx) => {
    const keys = AGENT_STEPS.map(a => a.key);
    setAgents(prev => {
      const next = { ...prev };
      if (stepIdx > 0) next[keys[stepIdx - 1]] = "done";
      if (stepIdx < keys.length) next[keys[stepIdx]] = "running";
      return next;
    });
  };

  const fmtElapsed = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const runSimulation = async () => {
    if (!productText.trim()) { setError("Please describe your product."); return; }
    setError("");
    setRunning(true);
    setElapsed(0);
    setAgents(IDLE);
    msgIdx.current = 0;
    setRunMsg(POLL_MESSAGES[0]);

    // Company info from localStorage (set by CompanyPage)
    const companyInfo = localStorage.getItem("rr_company_info") ||
      `Company: ${user?.company || "Demo Corp"} | Sector: ${user?.sector || "Technology"}`;

    // Build project_info combining text + slider params
    const projectInfo = `${productText}

Financial parameters:
- Launch price: $${params.precio}
- Unit cost: $${params.costo_unitario} | Logistics: $${params.costo_logistico}
- Marketing budget: $${(params.presupuesto_marketing / 1000).toFixed(0)}K
- Estimated market size: ${(params.tamano_mercado_estimado / 1000).toFixed(0)}K units
- Price elasticity: ${params.elasticidad}
- Competitive threat: ${Math.round(params.agresividad_competitiva * 100)}%
- Regulatory risk: ${Math.round(params.riesgo_regulatorio * 100)}%
${params.shock_macro ? "- Scenario: Macro shock active" : ""}
${params.competitor_price_war ? "- Scenario: Competitor price war active" : ""}

Geographic focus: California and surrounding regions
(Los Angeles CA, San Francisco Bay Area CA, San Diego CA, Las Vegas NV)`;

    try {
      const res = await fetch(`${API_BASE}/analyze/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_info: projectInfo,
          company_info: companyInfo,
          ...params,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || `Backend error ${res.status}`);
      }
      const { job_id } = await res.json();

      // Elapsed timer
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);

      // Rotate agent messages every 10s
      let step = 0;
      animateStep(step);
      msgTimer.current = setInterval(() => {
        step = Math.min(step + 1, AGENT_STEPS.length - 1);
        animateStep(step);
        msgIdx.current = Math.min(msgIdx.current + 1, POLL_MESSAGES.length - 1);
        setRunMsg(POLL_MESSAGES[msgIdx.current]);
      }, 10000);

      // Poll backend every 10s
      pollRef.current = setInterval(async () => {
        try {
          const pr = await fetch(`${API_BASE}/analyze/status/${job_id}`);
          if (!pr.ok) return;
          const job = await pr.json();

          if (job.status === "done" || job.status === "waiting_approval") {
            stopAll();
            setAgents(Object.fromEntries(AGENT_STEPS.map(a => [a.key, "done"])));
            setRunMsg("Analysis complete — loading results…");
            await new Promise(r => setTimeout(r, 400));

            const report = {
              ...job,
              job_id,
              projectInfo: productText,
              companyInfo,
              timestamp: job.timestamp || new Date().toISOString(),
            };

            const existing = JSON.parse(localStorage.getItem("rr_reports") || "[]");
            localStorage.setItem("rr_reports", JSON.stringify([report, ...existing].slice(0, 20)));

            fetch(`${API_BASE}/analyze/status/${job_id}`, { method: "DELETE" }).catch(() => {});
            setRunning(false);
            setRunMsg("");
            onSimResult(report);

          } else if (job.status === "error") {
            stopAll();
            setError(`Analysis failed: ${job.detail || "Unknown error"}`);
            setRunning(false);
            setAgents(IDLE);
          }
        } catch (err) {
          console.error("Poll error:", err);
        }
      }, 10000);

    } catch (err) {
      setError(`${err.message}`);
      setRunning(false);
      setAgents(IDLE);
      stopAll();
    }
  };

  return (
    <div style={{ height: "100vh", overflowY: "auto", padding: "18px 22px", background: C.bg, fontFamily: FONT }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: t3, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 3, fontWeight: 600 }}>
          Step 1 of 2
        </div>
        <div style={{ fontSize: TS.pageTitle, fontWeight: 700, color: t1, letterSpacing: "-0.01em" }}>
          Product <span style={{ color: C.red }}>Analysis</span>
        </div>
        <div style={{ fontSize: TS.pageSub, color: t2, marginTop: 4 }}>
          Configure your product scenario and launch the AI risk simulation
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14 }}>

        {/* LEFT */}
        <div>
          {/* Product Info */}
          <Panel style={{ marginBottom: 12 }}>
            <Label color={C.teal}>Product Information</Label>
            <div style={{ fontSize: TS.fieldLabel, color: t3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>
              Product Description
            </div>
            <textarea
              value={productText}
              onChange={e => setProductText(e.target.value)}
              placeholder="Describe your product, target market, key features, competitive advantages, launch timeline, target region…"
              rows={5}
              style={{
                width: "100%", background: C.bg2, border: `1px solid ${C.border}`,
                borderRadius: 5, padding: "10px 12px", color: t1,
                fontSize: TS.textareaText, fontFamily: FONT, resize: "vertical",
                outline: "none", lineHeight: 1.7, boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = C.teal}
              onBlur={e  => e.target.style.borderColor = C.border}
              disabled={running}
            />
          </Panel>

          {/* Pricing / Costs */}
          <Panel style={{ marginBottom: 12 }}>
            <Label color={C.teal}>Pricing / Costs</Label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <div>
                <Slider label="Launch Price" name="precio"          min={49}   max={999}     step={1}     value={params.precio}          onChange={set} format={v=>`$${v}`} />
                <Slider label="Unit Cost"    name="costo_unitario"  min={10}   max={500}     step={1}     value={params.costo_unitario}  onChange={set} format={v=>`$${v}`} />
                <Slider label="Logistics"    name="costo_logistico" min={2}    max={150}     step={1}     value={params.costo_logistico} onChange={set} format={v=>`$${v}`} />
              </div>
              <div>
                <Slider label="Mktg Budget" name="presupuesto_marketing"   min={50000}  max={5000000} step={50000}  value={params.presupuesto_marketing}   onChange={set} format={v=>`$${(v/1000).toFixed(0)}K`} />
                <Slider label="Market Size" name="tamano_mercado_estimado" min={10000}  max={5000000} step={10000}  value={params.tamano_mercado_estimado} onChange={set} format={v=>`${(v/1000).toFixed(0)}K`} />
                <Slider label="Elasticity"  name="elasticidad"             min={0.5}    max={3.5}     step={0.1}    value={params.elasticidad}             onChange={set} />
              </div>
            </div>
            {/* Live KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              {[
                { label: "Unit Margin", value: `$${margin.toFixed(0)}`,           color: margin > 0 ? C.teal : C.red },
                { label: "Margin %",    value: `${marginPct}%`,                   color: parseFloat(marginPct) > 20 ? C.teal : C.amber },
                { label: "Break-even",  value: `${breakeven.toLocaleString()} u`, color: C.t4 },
              ].map(k => (
                <div key={k.label} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 7, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: t2, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 5 }}>{k.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: t1 }}>
                    {k.value}
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: k.color, display: "inline-block", marginLeft: 5, marginBottom: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Risk Factors */}
          <Panel style={{ marginBottom: 12 }}>
            <Label color={C.red}>Risk Factors</Label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 12 }}>
              <Slider label="Competitive Threat" name="agresividad_competitiva" min={0} max={1} step={0.05} value={params.agresividad_competitiva} onChange={set} format={v=>`${Math.round(v*100)}%`} />
              <Slider label="Regulatory Risk"    name="riesgo_regulatorio"      min={0} max={1} step={0.05} value={params.riesgo_regulatorio}      onChange={set} format={v=>`${Math.round(v*100)}%`} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              {[
                { key: "shock_macro",          label: "Macro Shock",  desc: "Recession + inflation +15%" },
                { key: "competitor_price_war", label: "Price War",    desc: "Competitor drops price -20%" },
              ].map(t => (
                <div key={t.key} onClick={() => !running && set(t.key, !params[t.key])} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: params[t.key] ? C.redDeep : C.bg2,
                  border: `1px solid ${params[t.key] ? C.red+"50" : C.border}`,
                  borderRadius: 6, padding: "10px 12px",
                  cursor: running ? "not-allowed" : "pointer", transition: "all 0.15s",
                }}>
                  <div>
                    <div style={{ fontSize: TS.toggleLabel, color: params[t.key] ? t1 : t2, fontWeight: params[t.key] ? 600 : 400 }}>{t.label}</div>
                    <div style={{ fontSize: TS.toggleDesc, color: t3, marginTop: 2 }}>{t.desc}</div>
                  </div>
                  <div style={{ width: 30, height: 16, background: params[t.key] ? C.red : C.border2, border: `1px solid ${params[t.key] ? C.red : C.border}`, borderRadius: 8, position: "relative", flexShrink: 0, marginLeft: 10 }}>
                    <div style={{ position: "absolute", top: 2, left: params[t.key] ? 15 : 2, width: 12, height: 12, background: params[t.key] ? t1 : t3, borderRadius: "50%", transition: "left 0.15s" }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Error */}
          {error && (
            <div style={{ background: C.redDeep, border: `1px solid ${C.red}40`, borderRadius: 6, padding: "10px 14px", marginBottom: 12 }}>
              <div style={{ color: t2, fontSize: TS.errorText, whiteSpace: "pre-line", lineHeight: 1.7 }}>{error}</div>
            </div>
          )}

          {/* Running message */}
          {running && runMsg && (
            <div style={{ background: C.tealDeep, border: `1px solid ${C.teal}30`, borderRadius: 6, padding: "9px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 9 }}>
              <Spinner size={14} />
              <span style={{ fontSize: TS.runMsg, color: t2, flex: 1 }}>{runMsg}</span>
              <span style={{ fontSize: 12, color: t3, fontFamily: "monospace" }}>{fmtElapsed(elapsed)}</span>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div style={{ position: "sticky", top: 18 }}>
          {/* Agents */}
          <Panel style={{ marginBottom: 12 }}>
            <Label color={C.teal}>Airia Agents</Label>
            {AGENT_STEPS.map(a => <AgentRow key={a.key} name={a.label} status={agents[a.key]} />)}
            {running && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                <Spinner size={24} />
                <div style={{ fontSize: 11, color: t3, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
                  Airia Running
                </div>
                {elapsed > 0 && (
                  <div style={{ fontSize: 11, color: t3, fontFamily: "monospace" }}>
                    {fmtElapsed(elapsed)} elapsed
                  </div>
                )}
              </div>
            )}
          </Panel>

          {/* Preview */}
          <Panel style={{ marginBottom: 12 }}>
            <Label>Scenario Preview</Label>
            {[
              { l: "Price",       v: `$${params.precio}`,                                          c: t1 },
              { l: "Unit Margin", v: `$${margin.toFixed(0)}`,                                     c: margin > 0 ? C.teal : C.red },
              { l: "Margin %",    v: `${marginPct}%`,                                             c: parseFloat(marginPct) > 20 ? C.teal : C.amber },
              { l: "Mktg Budget", v: `$${(params.presupuesto_marketing/1000).toFixed(0)}K`,       c: t2 },
              { l: "Market Size", v: `${(params.tamano_mercado_estimado/1000).toFixed(0)}K units`,c: t2 },
              { l: "Competition", v: `${Math.round(params.agresividad_competitiva*100)}%`,        c: params.agresividad_competitiva > 0.6 ? C.red : C.amber },
              { l: "Reg. Risk",   v: `${Math.round(params.riesgo_regulatorio*100)}%`,             c: params.riesgo_regulatorio > 0.5 ? C.red : C.amber },
            ].map(s => (
              <div key={s.l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.divider}` }}>
                <span style={{ fontSize: TS.previewLabel, color: t3, fontWeight: 500 }}>{s.l}</span>
                <span style={{ fontSize: TS.previewValue, color: s.c, fontWeight: 600 }}>{s.v}</span>
              </div>
            ))}
          </Panel>

          <Btn onClick={runSimulation} disabled={running} variant="teal" style={{ width: "100%", padding: "16px 0", fontSize: 15 }}>
            {running ? "Running AI Analysis…" : "Run AI Risk Simulation →"}
          </Btn>
        </div>
      </div>
    </div>
  );
}