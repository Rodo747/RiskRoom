import React, { useState, useCallback } from "react";
import { C, FONT } from "./theme.js";
import { Panel, Label, KPI, Btn, AgentRow, Spinner, Slider } from "./components.jsx";
import { API_BASE } from "./config.js";

// Text hierarchy tokens
const t1 = C.t1 || "#E6EDF3";
const t2 = C.t2 || "#A8B3C2";
const t3 = C.t3 || "#6B7A8D";

// Type scale configuration
const TS = {
  pageStep:    14,
  pageTitle:   34,
  pageSub:     16,
  fieldLabel:  14,
  uploadLabel: 16,
  uploadIcon:  34,
  textareaText:17,
  toggleLabel: 16,
  toggleDesc:  14,
  previewLabel:15,
  previewValue:16,
  agentCoord:  14,
  runMsg:      15,
  errorText:   16,
};

// Default simulation parameters
const DEMO_PARAMS = {
  precio: 299,
  costo_unitario: 89,
  costo_logistico: 22,
  presupuesto_marketing: 650000,
  elasticidad: 1.6,
  agresividad_competitiva: 0.65,
  riesgo_regulatorio: 0.35,
  tamano_mercado_estimado: 420000,
  shock_macro: false,
  competitor_price_war: false,
  iteraciones: 500,
};

// Agent pipeline steps
const AGENT_STEPS = [
  { key: "data_ingestion", label: "Data Ingestion Agent",       msg: "Ingesting company data..."                      },
  { key: "orchestrator",   label: "Orchestrator Agent",         msg: "Coordinating agent pipeline..."                 },
  { key: "market",         label: "Market Intelligence Agent",  msg: "Searching California wearables market..."       },
  { key: "competitor",     label: "Competitor Adversary Agent", msg: "Analyzing Apple Watch & Fitbit pricing..."      },
  { key: "regulatory",     label: "Regulatory Risk Agent",      msg: "Checking FDA compliance requirements..."        },
  { key: "pricing",        label: "Pricing Optimizer",          msg: "Calculating optimal price range..."             },
  { key: "riskanalyst",    label: "Risk Analyst",               msg: "Interpreting Monte Carlo results..."            },
  { key: "mitigation",     label: "Mitigation Strategist Agent",msg: "Designing risk mitigation plan..."              },
  { key: "multichannel",   label: "Multi-channel Output Agent", msg: "Generating reports and insights..."             },
];

// Main analysis page component
export default function AnalysisPage({ user, onSimResult }) {
  const [params,      setParams]      = useState(DEMO_PARAMS);
  const [productText, setProductText] = useState("");
  const [productFile, setProductFile] = useState(null);
  const [running,     setRunning]     = useState(false);
  const [runMsg,      setRunMsg]      = useState("");
  const [agents,      setAgents]      = useState(
    Object.fromEntries(AGENT_STEPS.map(a => [a.key, "idle"]))
  );
  const [error, setError] = useState("");

  // Parameter update helper
  const set = useCallback((n, v) => setParams(p => ({ ...p, [n]: v })), []);

  // Handle file selection
  const handleFileChange = e => {
    const f = e.target.files?.[0];
    if (f) setProductFile(f);
  };

  // Upload product document metadata to backend
  const sendProductDoc = async (file) => {
    if (!file) return null;
    try {
      const res = await fetch(`${API_BASE}/product-doc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          file_size: file.size,
          file_type: file.type,
          product_description: productText,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.doc;
      }
    } catch (err) {
      console.log("Product doc upload skipped:", err.message);
    }
    return null;
  };

  // Validate parameters before simulation
  const validateParams = () => {
    const errors = [];
    if (params.precio < 1)                                              errors.push("Price must be greater than $0");
    if (params.costo_unitario < 0)                                      errors.push("Unit cost cannot be negative");
    if (params.costo_logistico < 0)                                     errors.push("Logistics cost cannot be negative");
    if (params.presupuesto_marketing < 0)                               errors.push("Marketing budget cannot be negative");
    if (params.tamano_mercado_estimado < 1000)                          errors.push("Market size must be at least 1,000");
    if (params.elasticidad <= 0)                                        errors.push("Elasticity must be positive");
    if (params.agresividad_competitiva < 0 || params.agresividad_competitiva > 1) errors.push("Competitive threat must be 0-100%");
    if (params.riesgo_regulatorio < 0 || params.riesgo_regulatorio > 1) errors.push("Regulatory risk must be 0-100%");
    return errors;
  };

  // Run simulation with agent pipeline
  const runSimulation = async () => {
    const errors = validateParams();
    if (errors.length > 0) {
      setError("Please fix the following:\n" + errors.map(e => "• " + e).join("\n"));
      return;
    }

    await sendProductDoc(productFile);

    setRunning(true);
    setError("");
    setRunMsg("");

    // Initialize agent pipeline
    const resetAgents = Object.fromEntries(AGENT_STEPS.map(a => [a.key, "idle"]));
    setAgents({ ...resetAgents, orchestrator: "running" });
    setRunMsg("Initializing Airia orchestrator...");
    await new Promise(r => setTimeout(r, 600));

    setAgents(a => ({ ...a, market: "running", competitor: "running", regulatory: "running" }));
    setRunMsg("Agents analyzing market, competition, and regulation in parallel...");
    await new Promise(r => setTimeout(r, 900));

    try {
      // Call backend analysis endpoint
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, product_description: productText }),
      });
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const json = await res.json();

      setAgents(a => ({ ...a, market: "done", competitor: "done", regulatory: "done", riskanalyst: "running" }));
      setRunMsg("Risk Analyst interpreting Monte Carlo results...");
      await new Promise(r => setTimeout(r, 600));

      setAgents(a => ({ ...a, riskanalyst: "done", pricing: "running", mitigation: "running" }));
      setRunMsg("Pricing Optimizer and Mitigation Strategist finalizing...");
      await new Promise(r => setTimeout(r, 500));

      // Fetch AI insight from backend
      let insight = "";
      try {
        const insightRes = await fetch(`${API_BASE}/insight`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metricas: json.data.metricas,
            nivel_riesgo: json.data.analisis.nivel_riesgo,
            product_description: productText,
          }),
        });
        const insightJson = await insightRes.json();
        insight = insightJson.insight || "";
      } catch (insightErr) {
        console.log("Insight fallback:", insightErr);
        insight = json.data.analisis?.recomendacion || "";
      }

      setAgents(a => ({ ...a, pricing: "done", mitigation: "done", orchestrator: "done" }));
      setRunMsg("Analysis complete. Redirecting to results...");
      await new Promise(r => setTimeout(r, 600));

      // Pass results to parent component
      onSimResult({
        ...json.data,
        insight,
        params,
        productText,
        timestamp: new Date().toISOString(),
        isDemo: false,
      });

    } catch (err) {
      setError(`Backend unavailable. Make sure FastAPI is running on ${API_BASE}.\n${err.message}`);
      setAgents(resetAgents);
    }

    setRunning(false);
    setRunMsg("");
  };

  // Calculate live margin metrics
  const margin    = params.precio - params.costo_unitario - params.costo_logistico;
  const marginPct = ((margin / params.precio) * 100).toFixed(1);
  const breakeven = Math.ceil(params.presupuesto_marketing / Math.max(margin, 1));

  return (
    <div style={{ height: "100vh", overflowY: "auto", padding: "18px 22px", background: C.bg, fontFamily: FONT }}>

      {/* Page header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: TS.pageStep, color: t3, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 3, fontWeight: 600 }}>
          Step 1 of 2
        </div>
        <div style={{ fontSize: TS.pageTitle, fontWeight: 700, color: t1, letterSpacing: "-0.01em" }}>
          Product Analysis
        </div>
        <div style={{ fontSize: TS.pageSub, color: t2, marginTop: 4 }}>
          Configure your product scenario and launch the AI risk simulation
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14 }}>

        {/* Left: Configuration panels */}
        <div>

          {/* Product information panel */}
          <Panel style={{ marginBottom: 12 }}>
            <Label color={C.teal}>Product Information</Label>

            {/* File upload zone */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: TS.fieldLabel, color: t3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>
                Product Document
              </div>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: C.bg2,
                border: `1px dashed ${productFile ? C.teal : C.border2}`,
                borderRadius: 6,
                padding: "12px 14px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}>
                <span style={{ fontSize: TS.uploadIcon, color: productFile ? C.teal : t3, lineHeight: 1 }}>↑</span>
                <span style={{ fontSize: TS.uploadLabel, color: productFile ? t1 : t2, fontFamily: FONT, fontWeight: productFile ? 600 : 400 }}>
                  {productFile ? productFile.name : "Upload Product PDF / Specification"}
                </span>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={{ display: "none" }} />
              </label>
            </div>

            {/* Additional context textarea */}
            <div>
              <div style={{ fontSize: TS.fieldLabel, color: t3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>
                Additional Context
              </div>
              <textarea
                value={productText}
                onChange={e => setProductText(e.target.value)}
                placeholder="Describe the product, target market, key features, competitive advantages, regulatory context, launch timeline..."
                style={{
                  width: "100%",
                  minHeight: 80,
                  background: C.bg2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 5,
                  padding: "10px 12px",
                  color: t1,
                  fontSize: TS.textareaText,
                  fontFamily: FONT,
                  resize: "vertical",
                  outline: "none",
                  lineHeight: 1.7,
                  boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = C.teal}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
            </div>
          </Panel>

          {/* Pricing and costs panel */}
          <Panel style={{ marginBottom: 12 }}>
            <Label color={C.teal}>Pricing / Costs</Label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <div>
                <Slider label="Launch Price" name="precio"           min={49}  max={999}  step={1}   value={params.precio}           onChange={set} format={v => `$${v}`} />
                <Slider label="Unit Cost"    name="costo_unitario"   min={10}  max={500}  step={1}   value={params.costo_unitario}   onChange={set} format={v => `$${v}`} />
                <Slider label="Logistics"    name="costo_logistico"  min={2}   max={150}  step={1}   value={params.costo_logistico}  onChange={set} format={v => `$${v}`} />
              </div>
              <div>
                <Slider label="Mktg Budget"  name="presupuesto_marketing"   min={50000}  max={5000000} step={50000}  value={params.presupuesto_marketing}   onChange={set} format={v => `$${(v / 1000).toFixed(0)}K`} />
                <Slider label="Market Size"  name="tamano_mercado_estimado" min={10000}  max={5000000} step={10000}  value={params.tamano_mercado_estimado} onChange={set} format={v => `${(v / 1000).toFixed(0)}K`} />
                <Slider label="Elasticity"   name="elasticidad"             min={0.5}    max={3.5}     step={0.1}    value={params.elasticidad}             onChange={set} />
              </div>
            </div>

            {/* Live margin KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <KPI label="Unit Margin"  value={`$${margin.toFixed(0)}`}           color={margin > 0 ? C.teal : C.red} />
              <KPI label="Margin %"     value={`${marginPct}%`}                   color={parseFloat(marginPct) > 20 ? C.teal : C.amber} />
              <KPI label="Break-even"   value={`${breakeven.toLocaleString()} u`} color={C.t4 || "#3A4A5C"} />
            </div>
          </Panel>

          {/* Risk factors panel */}
          <Panel style={{ marginBottom: 12 }}>
            <Label color={C.red}>Risk Factors</Label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 12 }}>
              <Slider label="Competitive Threat" name="agresividad_competitiva" min={0} max={1} step={0.05} value={params.agresividad_competitiva} onChange={set} format={v => `${Math.round(v * 100)}%`} />
              <Slider label="Regulatory Risk"    name="riesgo_regulatorio"      min={0} max={1} step={0.05} value={params.riesgo_regulatorio}      onChange={set} format={v => `${Math.round(v * 100)}%`} />
            </div>

            {/* Scenario toggle switches */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              {[
                { key: "shock_macro",          label: "Macro Shock",  desc: "Recession + inflation +15%" },
                { key: "competitor_price_war", label: "Price War",    desc: "Competitor drops price -20%" },
              ].map(t => (
                <div
                  key={t.key}
                  onClick={() => set(t.key, !params[t.key])}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: params[t.key] ? `${C.redDeep}` : C.bg2,
                    border: `1px solid ${params[t.key] ? C.red + "50" : C.border}`,
                    borderRadius: 6,
                    padding: "10px 12px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div>
                    <div style={{ fontSize: TS.toggleLabel, color: params[t.key] ? t1 : t2, fontWeight: params[t.key] ? 600 : 400, fontFamily: FONT }}>
                      {t.label}
                    </div>
                    <div style={{ fontSize: TS.toggleDesc, color: t3, marginTop: 2, fontFamily: FONT }}>
                      {t.desc}
                    </div>
                  </div>

                  {/* Toggle switch */}
                  <div style={{
                    width: 30, height: 16,
                    background: params[t.key] ? C.red : C.border2,
                    border: `1px solid ${params[t.key] ? C.red : C.border}`,
                    borderRadius: 8,
                    position: "relative",
                    transition: "all 0.15s",
                    flexShrink: 0,
                    marginLeft: 10,
                  }}>
                    <div style={{
                      position: "absolute",
                      top: 2,
                      left: params[t.key] ? 15 : 2,
                      width: 12, height: 12,
                      background: params[t.key] ? C.t1 || "#E6EDF3" : t3,
                      borderRadius: "50%",
                      transition: "left 0.15s",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Error message display */}
          {error && (
            <div style={{
              background: C.redDeep,
              border: `1px solid ${C.red}40`,
              borderRadius: 6,
              padding: "10px 14px",
              marginBottom: 12,
              fontFamily: FONT,
            }}>
              <div style={{ color: t2, fontSize: TS.errorText, whiteSpace: "pre-line", lineHeight: 1.7 }}>
                {error}
              </div>
            </div>
          )}

          {/* Running status message */}
          {running && runMsg && (
            <div style={{
              background: `${C.tealDeep}`,
              border: `1px solid ${C.teal}30`,
              borderRadius: 6,
              padding: "9px 14px",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 9,
            }} className="fi">
              <Spinner size={14} />
              <span style={{ fontSize: TS.runMsg, color: t2, letterSpacing: "0.04em", fontFamily: FONT }}>
                {runMsg}
              </span>
            </div>
          )}

        </div>

        {/* Right: Agent status and scenario preview */}
        <div>

          {/* Agent pipeline status panel */}
          <Panel style={{ marginBottom: 12 }}>
            <Label color={C.teal}>Airia Agents</Label>
            {AGENT_STEPS.map(a => (
              <AgentRow key={a.key} name={a.label} status={agents[a.key]} />
            ))}

            {/* Loading spinner during simulation */}
            {running && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 18, padding: "14px 0" }}>
                <Spinner size={28} />
                <div style={{ fontSize: TS.agentCoord, color: t3, letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", fontFamily: FONT, fontWeight: 600 }}>
                  Coordinating Agents
                </div>
              </div>
            )}
          </Panel>

          {/* Scenario preview panel */}
          <Panel>
            <Label>Scenario Preview</Label>
            {[
              { l: "Price",       v: `$${params.precio}`,                                                                         c: t1 },
              { l: "Unit Margin", v: `$${(params.precio - params.costo_unitario - params.costo_logistico).toFixed(0)}`,           c: margin > 0 ? C.teal : C.red },
              { l: "Margin %",    v: `${((params.precio - params.costo_unitario - params.costo_logistico) / params.precio * 100).toFixed(1)}%`, c: parseFloat(marginPct) > 20 ? C.teal : C.amber },
              { l: "Mktg Budget", v: `$${(params.presupuesto_marketing / 1000).toFixed(0)}K`,                                     c: t2 },
              { l: "Market Size", v: `${(params.tamano_mercado_estimado / 1000).toFixed(0)}K units`,                              c: t2 },
              { l: "Competition", v: `${Math.round(params.agresividad_competitiva * 100)}%`,                                      c: params.agresividad_competitiva > 0.6 ? C.red : C.amber },
              { l: "Reg. Risk",   v: `${Math.round(params.riesgo_regulatorio * 100)}%`,                                           c: params.riesgo_regulatorio > 0.5 ? C.red : C.amber },
            ].map(s => (
              <div key={s.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.divider}` }}>
                <span style={{ fontSize: TS.previewLabel, color: t3, fontFamily: FONT, fontWeight: 500 }}>
                  {s.l}
                </span>
                <span style={{ fontSize: TS.previewValue, color: s.c, fontWeight: 600, fontFamily: FONT }}>
                  {s.v}
                </span>
              </div>
            ))}
          </Panel>

          {/* Run simulation button */}
          <Btn 
            onClick={runSimulation} 
            disabled={running} 
            variant="teal" 
            style={{ 
              width: "100%", 
              padding: "16px 24px", 
              fontSize: 16,
              marginTop: 12 
            }}
          >
            {running ? "Running AI Risk Simulation..." : "Run AI Risk Simulation →"}
          </Btn>
        </div>

      </div>
    </div>
  );
}
