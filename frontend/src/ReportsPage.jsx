import React, { useState, useEffect } from "react";
import { C, FONT } from "./theme.js";
import { Panel, Label, KPI, Btn, Tag } from "./components.jsx";
import { generateRiskRoomPDF } from "./pdfGenerator.js";
// Text color tokens
const t1 = C.t1 || "#E6EDF3";
const t2 = C.t2 || "#A8B3C2";
const t3 = C.t3 || "#6B7A8D";

// Type scale configuration
const TS = {
  listTitle:    14,
  listHeading:  28,
  listItemTitle:16,
  listItemDate: 15,
  listItemROI:  16,
  listDemoBadge:14,
  detailDate:   14,
  detailTitle:  32,
  detailProduct:17,
  decisionLabel:14,
  decisionValue:16,
  bodyText:     16,
  emptyState:   17,
  selectMsg:    17,
};

// Helper formatters
const fmt  = (v, d = 1) => typeof v === "number" ? v.toFixed(d) : "-";
const fmtM = v => `$${fmt(v, 2)}M`;

// Adapt new Airia format → legacy display fields
function adapt(r) {
  if (!r || r.metricas) return r; // already adapted or demo
  const mc = r.monte_carlo || {};
  const m  = r.metrics     || {};
  const rec = r.recommendation || "REVIEW";
  const nivelMap = { PROCEED:"BAJO", REVIEW:"MEDIO", REJECT:"ALTO" };
  return {
    ...r,
    metricas: {
      prob_exito:         mc.prob_exito         || m.probability_of_success || 0,
      roi_esperado:       mc.roi_esperado        || 0,
      worst_case_roi:     mc.worst_case_roi      || 0,
      best_case_roi:      mc.best_case_roi       || 0,
      value_at_risk:      mc.value_at_risk       || 0,
      ingresos_esperados: mc.ingresos_esperados  || 0,
      utilidad_esperada:  mc.utilidad_esperada   || 0,
    },
    analisis: {
      nivel_riesgo:  r.analisis?.nivel_riesgo || nivelMap[rec] || "MEDIO",
      recomendacion: r.analisis?.recomendacion || r.executive_summary || r.full_analysis || "",
    },
    productText: r.productText || r.projectInfo || "Product Analysis",
    insight:     r.executive_summary || r.full_analysis || r.insight || "",
  };
}

// Main Reports page component
export default function ReportsPage({ user }) {
  const [reports,     setReports]     = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [downloading, setDownloading] = useState(false);

  // Load saved reports from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("rr_reports") || "[]");
    const adapted = saved.map(adapt);
    if (adapted.length === 0) {
      // Insert demo report if none exist
      const demo = [{
        analisis:    { nivel_riesgo: "MEDIO", recomendacion: "Expected ROI viable with prior regulatory mitigation." },
        metricas:    { prob_exito: 61.4, roi_esperado: 23.8, worst_case_roi: -18.4, value_at_risk: 1.3, ingresos_esperados: 7.84, utilidad_esperada: 3.84 },
        decision:    "approved",
        productText: "FitPulse Pro Smartwatch - California market entry",
        decisionTime: new Date(Date.now() - 86400000).toISOString(),
        timestamp:    new Date(Date.now() - 86400000).toISOString(),
        isDemo: true,
      }];
      setReports(demo);
      setSelected(demo[0]);
    } else {
      setReports(adapted);
      setSelected(adapted[0]);
    }
  }, []);

  const downloadPDF = () => {
    if (!selected) return;
    generateRiskRoomPDF(selected, selected.decision || "approved");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", height: "calc(100vh - 52px)", overflow: "hidden" }}>

      {/* Left: Report list */}
      <div style={{
        borderRight: `1px solid ${C.border}`,
        overflowY: "auto",
        padding: "16px 14px",
        background: C.bg,
      }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: TS.listTitle,
            color: t3,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 3,
            fontFamily: FONT,
            fontWeight: 600,
          }}>
            Analysis History
          </div>
          <div style={{ fontSize: TS.listHeading, fontWeight: 700, color: t1, fontFamily: FONT }}>
            Reports
          </div>
        </div>

        {/* Empty state */}
        {reports.length === 0 && (
          <div style={{ color: t2, fontSize: TS.emptyState, textAlign: "center", marginTop: 40, fontFamily: FONT }}>
            No reports yet. Run a simulation first.
          </div>
        )}

        {/* Report cards */}
        {reports.map((r, i) => {
          const isSelected = selected === r;
          const dc = r.decision === "approved" ? C.teal : C.red;
          return (
            <div
              key={i}
              onClick={() => setSelected(r)}
              style={{
                background: isSelected ? `${dc}0C` : C.panel,
                border: `1px solid ${isSelected ? dc + "35" : C.border}`,
                borderLeft: isSelected ? `2px solid ${dc}` : `2px solid transparent`,
                borderRadius: 6,
                padding: "10px 12px",
                marginBottom: 7,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                <div style={{
                  fontSize: TS.listItemTitle,
                  color: t1,
                  fontWeight: 600,
                  fontFamily: FONT,
                  flex: 1,
                  marginRight: 8,
                  lineHeight: 1.35,
                }}>
                  {r.productText?.slice(0, 35) || "Product Analysis"}...
                </div>
                <Tag label={r.decision?.toUpperCase() || "-"} color={dc} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: TS.listItemDate, color: t3, fontFamily: FONT }}>
                  {r.decisionTime ? new Date(r.decisionTime).toLocaleDateString() : "-"}
                </span>
                <span style={{
                  fontSize: TS.listItemROI,
                  color: r.metricas?.roi_esperado > 0 ? C.teal : C.red,
                  fontWeight: 600,
                  fontFamily: FONT,
                }}>
                  ROI {fmt(r.metricas?.roi_esperado)}%
                </span>
              </div>

              {r.isDemo && (
                <div style={{ fontSize: TS.listDemoBadge, color: C.amber, marginTop: 3, fontFamily: FONT, fontWeight: 500 }}>
                  Demo
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right: Selected report detail */}
      <div style={{ overflowY: "auto", padding: "18px 22px" }}>
        {!selected ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: "100%",
            color: t2,
            fontSize: TS.selectMsg,
            fontFamily: FONT,
          }}>
            Select a report from the left
          </div>
        ) : (
          <div>
            {/* Report header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: TS.detailDate, color: t3, letterSpacing: "0.14em", marginBottom: 4, fontFamily: FONT, textTransform: "uppercase", fontWeight: 500 }}>
                  {selected.decisionTime ? new Date(selected.decisionTime).toLocaleString() : "-"}
                </div>
                <div style={{ fontSize: TS.detailTitle, fontWeight: 700, color: t1, fontFamily: FONT, letterSpacing: "-0.01em" }}>
                  {selected.decision === "approved"
                    ? "Executive Approval Report"
                    : "Rejection Analysis Report"}
                </div>
                <div style={{ fontSize: TS.detailProduct, color: t2, marginTop: 4, fontFamily: FONT }}>
                  {selected.productText?.slice(0, 80)}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
                <Tag
                  label={selected.decision?.toUpperCase() || "PENDING"}
                  color={selected.decision === "approved" ? C.teal : C.teal}
                  size="large"
                />
                <Btn
                  onClick={downloadPDF}
                  disabled={downloading}
                  variant={selected.decision === "approved" ? "red" : "redOutline"}
                  style={{ width: "auto", padding: "8px 20px" }}
                >
                  {downloading ? "Generating..." : "Download PDF"}
                </Btn>
              </div>
            </div>

            {/* KPI summary row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9, marginBottom: 14 }}>
              <KPI label="Expected ROI"  value={`${fmt(selected.metricas?.roi_esperado)}%`}    color={selected.metricas?.roi_esperado > 0 ? C.teal : C.red} glow />
              <KPI label="Success Prob." value={`${fmt(selected.metricas?.prob_exito)}%`}       color={C.teal} />
              <KPI label="Value at Risk" value={fmtM(selected.metricas?.value_at_risk)}         color={C.red} />
              <KPI
                label="Risk Level"
                value={selected.analisis?.nivel_riesgo || "-"}
                color={
                  selected.analisis?.nivel_riesgo === "BAJO"  ? C.teal :
                  selected.analisis?.nivel_riesgo === "MEDIO" ? C.amber : C.red
                }
              />
            </div>

            {/* Decision block */}
            <Panel
              accentColor={selected.decision === "approved" ? C.red : C.red}
              accentSide="left"
              style={{ marginBottom: 12 }}
            >
              <Label color={selected.decision === "approved" ? C.teal : C.teal}>
                {selected.decision === "approved"
                  ? "Executive Decision - Approved"
                  : "Executive Decision - Rejected"}
              </Label>

              <div style={{ color: t2, fontSize: TS.bodyText, lineHeight: 1.85, marginBottom: 14, fontFamily: FONT }}>
                {selected.hitlMsg || selected.analisis?.recomendacion}
              </div>

              {/* Notification status cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {[
                  { label: "PDF Report", status: "Generated" },
                  { label: "Slack",      status: "Notified"  },
                  { label: "Email",      status: "Sent"      },
                ].map(item => {
                  const cc = selected.decision === "approved" ? C.teal : C.teal;
                  return (
                    <div key={item.label} style={{
                      background: `${cc}07`,
                      border: `1px solid ${cc}1A`,
                      borderRadius: 5,
                      padding: "10px 12px",
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: TS.decisionLabel, color: t3, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: FONT, fontWeight: 600 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: TS.decisionValue, color: t1, fontWeight: 700, fontFamily: FONT }}>
                        {item.status}
                      </div>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: cc, margin: "4px auto 0" }} />
                    </div>
                  );
                })}
              </div>
            </Panel>

            {/* Strategic analysis */}
            <Panel style={{ marginBottom: 12 }}>
              <Label>Strategic Analysis Summary</Label>
              <div style={{ color: t2, fontSize: TS.bodyText, lineHeight: 1.9, fontFamily: FONT }}>
                {selected.insight || selected.analisis?.recomendacion || "No analysis available."}
              </div>
            </Panel>

            {/* Financial summary */}
            <Panel>
              <Label>Financial Summary</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                <KPI label="Revenue Exp." value={fmtM(selected.metricas?.ingresos_esperados)} color={C.teal} />
                <KPI label="Profit Exp."  value={fmtM(selected.metricas?.utilidad_esperada)}  color={selected.metricas?.utilidad_esperada > 0 ? C.teal : C.red} />
                <KPI label="Worst Case"   value={`${fmt(selected.metricas?.worst_case_roi)}%`} color={C.red} />
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}