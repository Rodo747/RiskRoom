import React, { useState, useRef, useEffect } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell,
} from "recharts";

// Design tokens
const FONT = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// Color system
const C = {
  bg:       "#0B0F14",
  bg2:      "#0F141A",
  panel:    "#121821",
  panel2:   "#171F2B",
  overlay:  "#1A2231",
  border:   "#1F2A36",
  border2:  "#263445",
  divider:  "#1A2436",

  // Text hierarchy
  t1:       "#E6EDF3",
  t2:       "#A8B3C2",
  t3:       "#6B7A8D",
  t4:       "#3A4A5C",

  // Accents
  teal:     "#00C9A0",
  tealBrt:  "#00E5A8",
  tealDim:  "#00A07E",
  tealDeep: "#004A3A",
  blue:     "#00B4E5",
  red:      "#E53935",
  redBrt:   "#FF3B3B",
  redMid:   "#C0392B",
  redDeep:  "#2E0E0E",
  amber:    "#E5A020",
  amberBrt: "#FFB020",
  amberDim: "#9A6D10",
  chartGrid:"#1A2636",
};

// Type scale
const TS = {
  kpiXl:   32,
  kpiLg:   24,
  kpiMd:   20,
  pageTitle: 22,
  sectionHd: 15,
  labelRow:  14,
  labelSm:   13,
  body:      14,
  bodySm:    13,
  meta:      12,
  micro:     11,
  axis:      12,
  tableHd:   11,
  tableRow:  13,
  btn:       12,
};

const SHADOW = {
  card:     "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)",
  elevated: "0 4px 24px rgba(0,0,0,0.5)",
  glowTeal: "0 0 14px rgba(0,229,168,0.18)",
  glowRed:  "0 0 12px rgba(255,59,59,0.15)",
};

const riskColor  = n => ({ BAJO: C.teal, MEDIO: C.amber, ALTO: C.red, CRITICO: C.red }[n] || C.t3);
const deltaColor = v => v > 0 ? C.teal : v < 0 ? C.red : C.t3;
const fmt  = (v, d = 1) => typeof v === "number" ? v.toFixed(d) : "—";
const fmtM = v => `$${fmt(v, 2)}M`;
const fmtK = v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v);

// Demo data
const DEMO = {
  metricas: {
    prob_exito: 61.4, roi_esperado: 23.8, worst_case_roi: -18.4,
    best_case_roi: 67.2, value_at_risk: 1.3, ingresos_esperados: 7.84,
    utilidad_esperada: 3.84, unidades_promedio: 26200, std_roi: 18.6, roi_mediana: 22.1,
  },
  analisis: { nivel_riesgo: "MEDIO", recomendacion: "La simulacion indica viabilidad moderada." },
  escenarios: {
    optimista:  { prob: 41, roi_promedio: 52.3 },
    neutral:    { prob: 33, roi_promedio: 18.2 },
    pesimista:  { prob: 26, roi_promedio: -14.8 },
  },
  distribucion: Array.from({ length: 40 }, (_, i) => ({
    roi: -40 + i * 4,
    frecuencia: Math.round(Math.exp(-Math.pow(i - 20, 2) / 55) * 85 + Math.random() * 8),
  })),
  heatmap: Array.from({ length: 25 }, (_, i) => ({
    roi: 30 - (i % 5) * 9 - Math.floor(i / 5) * 7 + Math.random() * 4,
  })),
  insight: "The launch shows a 61.4% success probability with an expected ROI of 23.8%. FDA regulatory risk remains the primary uncertainty factor with $1.3M exposure at the 5th percentile. Pre-certification strategy is recommended to reduce risk level to LOW prior to launch.",
  params: { precio: 299 },
  timestamp: new Date().toISOString(),
  isDemo: true,
};

const COMPETITORS = [
  { name: "Apple Watch",  share: 42, color: C.red     },
  { name: "Garmin Venu",  share: 22, color: C.amber   },
  { name: "Fitbit Sense", share: 18, color: C.blue    },
  { name: "FitPulse Pro", share: 8,  color: C.tealBrt },
  { name: "Others",       share: 10, color: C.t4      },
];

const STATE_RISK = {
  "California":   { risk: 25, level: "BAJO",  label: "CA" },
  "Oregon":       { risk: 30, level: "BAJO",  label: "OR" },
  "Washington":   { risk: 32, level: "BAJO",  label: "WA" },
  "Nevada":       { risk: 35, level: "BAJO",  label: "NV" },
  "Arizona":      { risk: 40, level: "BAJO",  label: "AZ" },
  "Colorado":     { risk: 42, level: "MEDIO", label: "CO" },
  "Utah":         { risk: 44, level: "MEDIO", label: "UT" },
  "Texas":        { risk: 50, level: "MEDIO", label: "TX" },
  "New Mexico":   { risk: 52, level: "MEDIO", label: "NM" },
  "Idaho":        { risk: 38, level: "BAJO",  label: "ID" },
  "Montana":      { risk: 45, level: "MEDIO", label: "MT" },
  "Wyoming":      { risk: 46, level: "MEDIO", label: "WY" },
  "New York":     { risk: 55, level: "MEDIO", label: "NY" },
  "Florida":      { risk: 58, level: "MEDIO", label: "FL" },
  "Illinois":     { risk: 60, level: "ALTO",  label: "IL" },
};

const LEVEL_COLOR = {
  BAJO:    "#00C9A0",
  MEDIO:   "#E5A020",
  ALTO:    "#E53935",
  DEFAULT: "#0F1822",
};

// Shared components
const Panel = ({ children, accentColor, accentSide, style = {} }) => (
  <div style={{
    background: C.panel, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: "14px 16px",
    boxShadow: SHADOW.card, position: "relative",
    ...(accentColor && accentSide === "top"  && { borderTop:  `2px solid ${accentColor}` }),
    ...(accentColor && accentSide === "left" && { borderLeft: `2px solid ${accentColor}` }),
    ...style,
  }}>{children}</div>
);

// Label component
const Label = ({ children, color, style = {} }) => (
  <span style={{
    fontSize: TS.labelSm,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: color || C.t3,
    fontFamily: FONT,
    marginBottom: 10,
    display: "block",
    ...style,
  }}>{children}</span>
);

// KPI Card component
const KPI = ({ label, value, color, delta, sub, glow, large }) => {
  const glowShadow = glow ? SHADOW.glowTeal : SHADOW.card;
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`,
      borderRadius: 8, padding: "14px 16px", boxShadow: glowShadow,
    }}>
      <div style={{
        fontSize: TS.labelRow,
        fontWeight: 500,
        letterSpacing: "0.04em",
        color: C.t2,           
        fontFamily: FONT,
        marginBottom: 6,
      }}>{label}</div>


      <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
        <span style={{
          fontSize: large ? TS.kpiXl : TS.kpiLg,
          fontWeight: 700,
          color: C.t1,
          fontFamily: FONT,
          letterSpacing: large ? "-0.02em" : "-0.01em",
          lineHeight: 1.1,
        }}>{value}</span>
        {/* Accent delta badge */}
        {delta !== undefined && (
          <span style={{ fontSize: TS.meta, fontWeight: 600, color: deltaColor(delta) }}>
            {delta > 0 ? `+${fmt(delta)}%` : `${fmt(delta)}%`}
          </span>
        )}
        {/* Accent pip */}
        {delta === undefined && color && (
          <span style={{ width: 6, height: 6, borderRadius: "50%",
            background: color, display: "inline-block", marginBottom: 3 }} />
        )}
      </div>


      {sub && (
        <div style={{
          fontSize: TS.micro,  
          color: C.t3,
          fontFamily: FONT,
          marginTop: 5,
          fontWeight: 500,
        }}>{sub}</div>
      )}
    </div>
  );
};

// Radial Gauge component
const RadialGauge = ({ value, label, color, size = 120 }) => {
  const r = size * 0.38, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const strokeDash = (pct / 100) * circ * 0.75;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border2} strokeWidth={5}
          strokeDasharray={`${circ * 0.75} ${circ}`} strokeLinecap="round"
          transform={`rotate(-135 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${strokeDash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-135 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 5px ${color}35)` }} />

        <text x={cx} y={cy + 3} textAnchor="middle" dominantBaseline="middle"
          fill={C.t1} fontSize={size * 0.20} fontWeight="700" fontFamily={FONT}>
          {pct.toFixed(0)}
        </text>

        <text x={cx} y={cy + size * 0.19} textAnchor="middle" dominantBaseline="middle"
          fill={C.t2} fontSize={size * 0.10} fontFamily={FONT} fontWeight="600">%</text>
      </svg>
      <span style={{
        fontSize: TS.meta,
        color: C.t2,
        fontFamily: FONT,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>{label}</span>
    </div>
  );
};

// Horizontal Bar component
const HBar = ({ label, value, color, right }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
      <span style={{
        fontSize: TS.labelRow,
        fontWeight: 500,
        color: C.t2,
        fontFamily: FONT,
      }}>{label}</span>

      <span style={{
        fontSize: TS.labelRow, 
        color: C.t1,
        fontFamily: FONT,
        fontWeight: 600,
      }}>{right}</span>
    </div>
    <div style={{ height: 4, background: C.border2, borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, background: color,
        borderRadius: 2, opacity: 0.9, transition: "width 0.6s ease" }} />
    </div>
  </div>
);

// Button component
const Btn = ({ children, onClick, disabled, variant = "teal", style = {} }) => {
  const variants = {
    teal:       { background: C.teal,  color: C.bg,   border: `1px solid ${C.teal}` },
    tealOutline:{ background: "transparent", color: C.teal, border: `1px solid ${C.teal}50` },
    redOutline: { background: "transparent", color: C.red,  border: `1px solid ${C.red}50` },
    ghost:      { background: "transparent", color: C.t2,   border: `1px solid ${C.border}` },
  };
  const v = variants[variant] || variants.teal;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...v, padding: "10px 20px", borderRadius: 6, fontFamily: FONT,
      fontSize: TS.btn,        
      fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
      transition: "all 0.15s ease", ...style,
    }}>{children}</button>
  );
};

// Tooltip component
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.panel2, border: `1px solid ${C.border2}`,
      borderRadius: 6, padding: "10px 14px", fontFamily: FONT, boxShadow: SHADOW.elevated }}>

      <div style={{ fontSize: TS.meta, color: C.t3, marginBottom: 6, fontWeight: 600, letterSpacing: "0.06em" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center" }}>

          <span style={{ fontSize: TS.meta, color: C.t2 }}>{p.name}</span>

          <span style={{ fontSize: TS.bodySm, color: C.t1, fontWeight: 600 }}>
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Map component
function WorldMap({ riskLevel }) {
  const svgRef = useRef(null);
  const [loaded, setLoaded]   = useState(false);
  const [error, setError]     = useState(null);
  const [hovered, setHovered] = useState(null);
  const mainRc = riskColor(riskLevel);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!window.d3) await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js";
          s.onload = res; s.onerror = () => rej(new Error("D3 failed"));
          document.head.appendChild(s);
        });
        if (!window.topojson) await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js";
          s.onload = res; s.onerror = () => rej(new Error("TopoJSON failed"));
          document.head.appendChild(s);
        });
        if (cancelled || !svgRef.current) return;
        const d3 = window.d3, topo = window.topojson;
        const svg = d3.select(svgRef.current);
        const W = 960, H = 340;
        svg.selectAll("*").remove();
        const us = await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json");
        if (cancelled || !us?.objects?.states) return;
        const states    = topo.feature(us, us.objects.states);
        const stateMesh = topo.mesh(us, us.objects.states, (a, b) => a !== b);
        const fipsToName = {
          "06":"California","41":"Oregon","53":"Washington","32":"Nevada","04":"Arizona",
          "08":"Colorado","49":"Utah","48":"Texas","35":"New Mexico","16":"Idaho",
          "30":"Montana","56":"Wyoming","36":"New York","12":"Florida","17":"Illinois",
        };
        svg.append("rect").attr("width",W).attr("height",H).attr("fill",C.bg);
        const gG = svg.append("g");
        [68,136,204,272].forEach(y => gG.append("line").attr("x1",0).attr("y1",y).attr("x2",W).attr("y2",y).attr("stroke",C.chartGrid).attr("stroke-width",0.5).attr("opacity",0.45));
        [96,192,288,384,480,576,672,768,864].forEach(x => gG.append("line").attr("x1",x).attr("y1",0).attr("x2",x).attr("y2",H).attr("stroke",C.chartGrid).attr("stroke-width",0.5).attr("opacity",0.45));
        const proj = d3.geoAlbersUsa().scale(900).translate([W*0.52,H*0.52]);
        const path = d3.geoPath().projection(proj);
        svg.append("g").selectAll("path").data(states.features).join("path")
          .attr("d",path)
          .attr("fill",d => {
            const name = fipsToName[String(d.id).padStart(2,"0")];
            if (!name) return "#0F1822";
            const info = STATE_RISK[name];
            if (!info) return "#0F1822";
            return name==="California" ? `${LEVEL_COLOR[info.level]}28` : `${LEVEL_COLOR[info.level]}12`;
          })
          .attr("stroke",d => {
            const name = fipsToName[String(d.id).padStart(2,"0")];
            const info = STATE_RISK[name];
            return info ? LEVEL_COLOR[info.level] : C.border;
          })
          .attr("stroke-width",d => fipsToName[String(d.id).padStart(2,"0")]==="California" ? 1.5 : 0.5)
          .attr("opacity",d => STATE_RISK[fipsToName[String(d.id).padStart(2,"0")]] ? 1 : 0.5)
          .style("filter",d => fipsToName[String(d.id).padStart(2,"0")]==="California" ? `drop-shadow(0 0 5px ${mainRc}28)` : "none")
          .style("cursor",d => STATE_RISK[fipsToName[String(d.id).padStart(2,"0")]] ? "pointer" : "default")
          .on("mouseenter",(_,d) => { const n = fipsToName[String(d.id).padStart(2,"0")]; if(STATE_RISK[n]) setHovered(n); })
          .on("mouseleave",() => setHovered(null));
        svg.append("path").datum(stateMesh).attr("d",path).attr("fill","none").attr("stroke",C.border2).attr("stroke-width",0.6).attr("opacity",0.7);
        states.features.forEach(d => {
          const name = fipsToName[String(d.id).padStart(2,"0")];
          if (!STATE_RISK[name]) return;
          const centroid = path.centroid(d);
          if (!centroid || isNaN(centroid[0])) return;
          const isCA = name==="California";
          
          svg.append("text").attr("x",centroid[0]).attr("y",centroid[1]-(isCA?2:0))
            .attr("text-anchor","middle")
            .attr("fill",isCA ? C.t1 : C.t2)
            .attr("font-size",isCA ? 17 : 14)
            .attr("font-family",FONT)
            .attr("font-weight",isCA ? "700" : "600")
            .attr("opacity",isCA ? 1 : 0.85)
            .text(STATE_RISK[name].label);
          if (isCA) {

            svg.append("text").attr("x",centroid[0]).attr("y",centroid[1]+15)
              .attr("text-anchor","middle").attr("fill",mainRc)
              .attr("font-size",10).attr("font-family",FONT)
              .attr("opacity",0.7).text("TARGET");
          }
        });
        const sfC = proj([-122.4,37.8]);
        if (sfC) {
          const [sfx,sfy] = sfC;
          svg.append("circle").attr("cx",sfx).attr("cy",sfy).attr("r",14).attr("fill","none").attr("stroke",mainRc).attr("stroke-width",0.5).attr("opacity",0.22);
          svg.append("circle").attr("cx",sfx).attr("cy",sfy).attr("r",3).attr("fill",mainRc).attr("opacity",0.9);
          svg.append("text").attr("x",sfx-10).attr("y",sfy-8).attr("fill",C.t1)
            .attr("font-size",13).attr("font-family",FONT)
            .attr("font-weight","700").attr("text-anchor","end").attr("opacity",0.9).text("SAN FRANCISCO");
          svg.append("text").attr("x",sfx-10).attr("y",sfy+8).attr("fill",C.t3)
            .attr("font-size",11).attr("font-family",FONT)
            .attr("text-anchor","end").attr("opacity",0.8).text("Target Market");
        }
        if (!cancelled) setLoaded(true);
      } catch(err) { if(!cancelled){ setError(err.message); setLoaded(true); } }
    };
    load();
    return () => { cancelled = true; };
  }, [mainRc]);

  return (
    <div style={{ position:"relative",width:"100%",background:C.bg,borderRadius:6,overflow:"hidden",minHeight:240 }}>
      <svg ref={svgRef} viewBox="0 0 960 340"
        style={{ width:"100%",display:"block",opacity:loaded?1:0.15,transition:"opacity 0.4s ease" }}
        preserveAspectRatio="xMidYMid meet">
        <rect width="960" height="340" fill={C.bg}/>
      </svg>
      {!loaded && (
        <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
          display:"flex",flexDirection:"column",alignItems:"center",gap:10,
          background:`${C.panel}f0`,padding:"18px 28px",borderRadius:8,border:`1px solid ${C.border}` }}>
          <div style={{ width:22,height:22,border:`2px solid ${C.border2}`,borderTopColor:C.teal,borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>

          <span style={{ fontSize:TS.bodySm,color:C.t2,fontFamily:FONT,letterSpacing:"0.08em",fontWeight:500 }}>
            Loading map data...
          </span>
        </div>
      )}
      {error && (
        <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
          background:C.redDeep,padding:"10px 18px",borderRadius:6,border:`1px solid ${C.red}40` }}>
          <span style={{ fontSize:TS.bodySm,color:C.red,fontFamily:FONT }}>{error}</span>
        </div>
      )}

      <div style={{ position:"absolute",bottom:10,right:12,display:"flex",flexDirection:"column",gap:7,
        background:`${C.panel}f0`,padding:"9px 13px",borderRadius:6,border:`1px solid ${C.border}` }}>
        {[{l:"Low Risk",c:LEVEL_COLOR.BAJO},{l:"Medium Risk",c:LEVEL_COLOR.MEDIO},{l:"High Risk",c:LEVEL_COLOR.ALTO}].map(x=>(
          <div key={x.l} style={{ display:"flex",alignItems:"center",gap:7 }}>
            <div style={{ width:10,height:2,borderRadius:1,background:x.c }}/>

            <span style={{ fontSize:TS.micro,color:C.t2,fontFamily:FONT,letterSpacing:"0.04em",fontWeight:500 }}>{x.l}</span>
          </div>
        ))}
      </div>

      {hovered && STATE_RISK[hovered] && (
        <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
          background:C.panel2,border:`1px solid ${C.border2}`,borderRadius:8,
          padding:"18px 24px",fontFamily:FONT,textAlign:"center",boxShadow:SHADOW.elevated,zIndex:10,minWidth:170 }}>

          <div style={{ fontSize:17,fontWeight:700,color:C.t1,marginBottom:6 }}>{hovered}</div>

          <div style={{ fontSize:TS.bodySm,color:C.t2,marginBottom:8 }}>
            Risk Score: <span style={{ color:C.t1,fontWeight:600 }}>{STATE_RISK[hovered].risk}%</span>
          </div>
          <div style={{ display:"inline-block",padding:"3px 10px",borderRadius:3,
            background:`${LEVEL_COLOR[STATE_RISK[hovered].level]}15`,
            border:`1px solid ${LEVEL_COLOR[STATE_RISK[hovered].level]}28` }}>

            <span style={{ fontSize:TS.micro,color:LEVEL_COLOR[STATE_RISK[hovered].level],fontWeight:600,letterSpacing:"0.08em" }}>
              {STATE_RISK[hovered].level}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Right sidebar
function RightSidebar({ m, data }) {
  const rc = riskColor(data.analisis?.nivel_riesgo);
  return (
    <div style={{ width:220,flexShrink:0,overflowY:"auto",padding:"0 0 20px 12px",display:"flex",flexDirection:"column",gap:10 }}>

      <Panel>
        <Label>Quick Stats</Label>
        {[
          { l:"ROI Exp.",   v:`${fmt(m.roi_esperado)}%`,  positive:m.roi_esperado>0 },
          { l:"Success",    v:`${fmt(m.prob_exito)}%`,    positive:true },
          { l:"VaR",        v:fmtM(m.value_at_risk),       risk:true },
          { l:"Best Case",  v:`${fmt(m.best_case_roi)}%`, positive:true },
          { l:"Units avg",  v:fmtK(m.unidades_promedio),  neutral:true },
          { l:"Std Dev",    v:`${fmt(m.std_roi)}%`,       neutral:true },
        ].map(s=>(
          <div key={s.l} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.divider}` }}>

            <span style={{ fontSize:TS.labelRow,color:C.t2,fontFamily:FONT,fontWeight:500 }}>{s.l}</span>
            <div style={{ display:"flex",alignItems:"center",gap:6 }}>

              <span style={{ fontSize:TS.labelRow,color:C.t1,fontWeight:700,fontFamily:FONT }}>{s.v}</span>
              <span style={{ width:5,height:5,borderRadius:"50%",flexShrink:0,
                background:s.risk?C.red:s.positive?C.teal:C.t4 }}/>
            </div>
          </div>
        ))}
      </Panel>

      <Panel>
        <Label>Competitor Pricing</Label>
        {[
          { l:"Apple Watch",  v:"$399" },
          { l:"Garmin Venu",  v:"$449" },
          { l:"Fitbit Sense", v:"$249" },
          { l:"FitPulse Pro", v:`$${data.params?.precio||299}`, ours:true },
        ].map((t,i)=>(
          <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.divider}` }}>

            <span style={{ fontSize:TS.labelRow,color:t.ours?C.t1:C.t2,fontFamily:FONT,fontWeight:t.ours?600:400 }}>{t.l}</span>
            <div style={{ display:"flex",alignItems:"center",gap:6 }}>

              <span style={{ fontSize:TS.labelRow,color:C.t1,fontWeight:t.ours?700:500,fontFamily:FONT }}>{t.v}</span>
              {t.ours && <span style={{ fontSize:10,color:C.teal,fontWeight:700,letterSpacing:"0.05em" }}>OUR</span>}
            </div>
          </div>
        ))}
      </Panel>

      <Panel>
        <Label>Simulation Info</Label>
        {[
          { l:"Iterations", v:"500" },
          { l:"Engine",     v:"Monte Carlo" },
          { l:"Agents",     v:"9 Airia" },
          { l:"Run at",     v:data.timestamp?new Date(data.timestamp).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"—" },
        ].map(s=>(
          <div key={s.l} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0" }}>

            <span style={{ fontSize:TS.bodySm,color:C.t3,fontFamily:FONT,fontWeight:500 }}>{s.l}</span>

            <span style={{ fontSize:TS.bodySm,color:C.t2,fontWeight:600,fontFamily:FONT }}>{s.v}</span>
          </div>
        ))}
      </Panel>


      <div style={{ background:C.panel,border:`1px solid ${C.border}`,borderTop:`2px solid ${rc}`,borderRadius:8,padding:"16px 14px",textAlign:"center" }}>

        <div style={{ fontSize:TS.meta,color:C.t3,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:FONT,marginBottom:7,fontWeight:600 }}>
          Risk Level
        </div>

        <div style={{ fontSize:TS.kpiMd,fontWeight:800,color:C.t1,fontFamily:FONT,letterSpacing:"-0.01em" }}>
          {data.analisis?.nivel_riesgo}
        </div>
        <div style={{ width:24,height:2,borderRadius:1,background:rc,margin:"7px auto" }}/>

        <div style={{ fontSize:TS.meta,color:C.t3,fontFamily:FONT,fontWeight:500 }}>
          {fmt(m.prob_exito)}% success prob.
        </div>
      </div>
    </div>
  );
}
import { API_BASE } from "./config.js";
// Main page
export default function ResultsPage({ simData, onNav }) {
  const hasRealData = simData && !simData.isDemo;
  const data = hasRealData ? simData : DEMO;
  const m    = data.metricas;
  const rc   = riskColor(data.analisis?.nivel_riesgo);

  const [decision,    setDecision]    = useState(null);
  const [loadingHITL, setLoadingHITL] = useState(false);
  const [hitlMsg,     setHitlMsg]     = useState("");
  const [optData,     setOptData]     = useState(null);
  const [optimizing,  setOptimizing]  = useState(false);
  const [error,       setError]       = useState("");


  const projection = Array.from({ length: 12 }, (_,i) => ({
    month: `M${i+1}`,
    optimistic:  parseFloat((m.best_case_roi  * (0.20+i*0.072)).toFixed(1)),
    base:        parseFloat((m.roi_esperado   * (0.20+i*0.072)).toFixed(1)),
    pessimistic: parseFloat((m.worst_case_roi * (0.20+i*0.072)).toFixed(1)),
  }));

  const runOptimize = async () => {
    setOptimizing(true);
    try {
      const res = await fetch(`${API_BASE}/optimize`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data.params||{})});
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      setOptData(json.data);
    } catch { setError(`Could not generate strategy variants. Make sure the backend is running on ${API_BASE}.`); }
    setOptimizing(false);
  };

  const handleDecision = async (type) => {
    setLoadingHITL(true);
    try {
      const res = await fetch(`${API_BASE}/insight`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({metricas:m,nivel_riesgo:data.analisis?.nivel_riesgo,product_description:data.productText})});
      if (!res.ok) throw new Error(`${res.status}`);
      const j = await res.json();
      setHitlMsg(j.insight||data.analisis?.recomendacion||"");
    } catch {
      setHitlMsg(type==="approved"?"Strategy approved. Roadmap activated.":"Launch rejected. Report generated.");
      setError("⚠️ Backend connection issue. Some features may not work.");
    }
    setDecision(type);
    setLoadingHITL(false);
  };

  useEffect(() => {
    if (!document.getElementById("manrope-font")) {
      const link = document.createElement("link");
      link.id="manrope-font"; link.rel="stylesheet";
      link.href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div style={{ height:"100vh",display:"flex",overflow:"hidden",background:C.bg,fontFamily:FONT }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border2}; border-radius: 2px; }
      `}</style>

      <div style={{ flex:1,overflowY:"auto",padding:"16px 14px 16px 18px" }}>


        <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:16,flexWrap:"wrap" }}>
          <div style={{ flex:1 }}>

            <div style={{ fontSize:TS.meta,color:C.t3,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:3,fontWeight:500 }}>
              {data.isDemo?"Demo · FitPulse Pro · California, USA":"Live · 500 Monte Carlo Iterations"}
            </div>

            <div style={{ fontSize:TS.pageTitle,fontWeight:800,color:C.t1,letterSpacing:"-0.02em" }}>Results Dashboard</div>
          </div>


          <div style={{ display:"flex",alignItems:"stretch",background:C.panel,
            border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden",
            boxShadow:"0 2px 12px rgba(0,0,0,0.3)" }}>
            <div style={{ padding:"10px 16px",borderRight:`1px solid ${C.border}` }}>

              <div style={{ fontSize:TS.meta,color:C.t3,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3,fontWeight:600 }}>Risk</div>
              <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                <div style={{ fontSize:TS.kpiMd,fontWeight:800,color:C.t1,lineHeight:1,letterSpacing:"-0.01em" }}>
                  {data.analisis?.nivel_riesgo}
                </div>
                <div style={{ width:7,height:7,borderRadius:"50%",background:rc,flexShrink:0 }}/>
              </div>
            </div>
            <div style={{ padding:"10px 14px",borderRight:`1px solid ${C.border}` }}>
              <div style={{ fontSize:TS.meta,color:C.t3,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3,fontWeight:600 }}>Success</div>
              <div style={{ fontSize:TS.kpiMd,fontWeight:800,color:C.t1,lineHeight:1,letterSpacing:"-0.01em",textShadow:SHADOW.glowTeal }}>
                {fmt(m.prob_exito)}<span style={{ fontSize:TS.labelRow,color:C.teal,marginLeft:1 }}>%</span>
              </div>
            </div>
            <div style={{ padding:"10px 14px" }}>
              <div style={{ fontSize:TS.meta,color:C.t3,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3,fontWeight:600 }}>ROI</div>
              <div style={{ display:"flex",alignItems:"baseline",gap:4 }}>
                <div style={{ fontSize:TS.kpiMd,fontWeight:800,color:C.t1,lineHeight:1,letterSpacing:"-0.01em" }}>
                  {fmt(m.roi_esperado)}%
                </div>
                <span style={{ fontSize:TS.meta,color:m.roi_esperado>0?C.teal:C.red,fontWeight:700 }}>
                  {m.roi_esperado>0?"▲":"▼"}
                </span>
              </div>
            </div>
          </div>

          {data.isDemo && (
            <div style={{ background:`${C.amber}0C`,border:`1px solid ${C.amber}22`,borderRadius:6,padding:"7px 12px",textAlign:"center" }}>

              <div style={{ fontSize:TS.micro,color:C.amber,fontWeight:700,letterSpacing:"0.06em" }}>DEMO DATA</div>
              <div style={{ fontSize:TS.micro,color:C.t3,fontWeight:400,marginTop:2 }}>Run simulation for live</div>
            </div>
          )}
        </div>


        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10 }}>
          <Panel accentColor={rc} accentSide="top">
            <Label>Global Risk Map · Target: California</Label>
            <WorldMap riskLevel={data.analisis?.nivel_riesgo} />
          </Panel>
          <Panel accentColor={C.red} accentSide="top">
            <Label>ROI Distribution · 500 Monte Carlo Simulations</Label>
            <ResponsiveContainer width="100%" height={195}>
              <AreaChart data={data.distribucion} margin={{top:4,right:4,left:-18,bottom:0}}>
                <defs>
                  <linearGradient id="mcFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.red} stopOpacity={0.45}/>
                    <stop offset="100%" stopColor={C.redDeep} stopOpacity={0.04}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 8" stroke={C.chartGrid} vertical={false} opacity={0.6}/>

                <XAxis dataKey="roi" tick={{fill:C.t2,fontSize:TS.axis,fontFamily:FONT}} tickFormatter={v=>`${v}%`} axisLine={{stroke:C.border}} tickLine={false}/>
                <YAxis tick={{fill:C.t2,fontSize:TS.axis,fontFamily:FONT}} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip/>}/>

                <ReferenceLine x={0} stroke={C.teal} strokeDasharray="4 4" strokeWidth={1.5}
                  label={{value:"Break-even",fill:C.t3,fontSize:TS.micro,fontFamily:FONT,position:"insideTopRight"}}/>
                <ReferenceLine x={parseFloat(fmt(m.roi_esperado,0))} stroke={C.amber} strokeDasharray="3 5" strokeWidth={1}
                  label={{value:"Exp. ROI",fill:C.t3,fontSize:TS.micro,fontFamily:FONT,position:"insideTopRight"}}/>
                <Area type="monotone" dataKey="frecuencia" name="Scenarios" stroke={C.red} fill="url(#mcFill)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>


        <div style={{ display:"grid",gridTemplateColumns:"auto 1fr",gap:10,marginBottom:10 }}>
          <Panel style={{ display:"flex",gap:22,alignItems:"center",padding:"18px 24px" }}>
            <RadialGauge value={m.prob_exito}                                  label="Success Prob." color={m.prob_exito>=60?C.teal:C.red} size={118}/>
            <RadialGauge value={Math.max(0,Math.min(100,m.roi_esperado+50))} label="ROI Index"      color={C.teal}  size={118}/>
            <RadialGauge value={100-m.prob_exito}                              label="Loss Risk"      color={C.red}   size={118}/>
          </Panel>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:9 }}>
            <KPI label="Expected ROI"  value={`${fmt(m.roi_esperado)}%`}    color={m.roi_esperado>0?C.teal:C.red}  delta={2.1} glow large/>
            <KPI label="Value at Risk" value={fmtM(m.value_at_risk)}         color={C.red}   sub={`Worst case: ${fmt(m.worst_case_roi)}%`} glow/>
            <KPI label="Revenue Exp."  value={fmtM(m.ingresos_esperados)}    color={C.teal}  sub={`Profit: ${fmtM(m.utilidad_esperada)}`}/>
            <KPI label="Best Case ROI" value={`${fmt(m.best_case_roi)}%`}    color={C.teal}  sub={`Units avg: ${fmtK(m.unidades_promedio)}`}/>
          </div>
        </div>


        <div style={{ display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:10,marginBottom:10 }}>
          <Panel accentColor={C.teal} accentSide="top">
            <Label>12-Month Scenario Projection</Label>
            <ResponsiveContainer width="100%" height={158}>
              <LineChart data={projection} margin={{top:4,right:8,left:-18,bottom:0}}>
                <CartesianGrid strokeDasharray="2 8" stroke={C.chartGrid} vertical={false} opacity={0.6}/>
                <XAxis dataKey="month" tick={{fill:C.t2,fontSize:TS.axis,fontFamily:FONT}} axisLine={{stroke:C.border}} tickLine={false}/>
                <YAxis tick={{fill:C.t2,fontSize:TS.axis,fontFamily:FONT}} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip/>}/>
                <ReferenceLine y={0} stroke={C.border2} strokeWidth={1}/>
                <Line type="monotone" dataKey="optimistic"  stroke={C.teal}    strokeWidth={2}   dot={false} name="Optimistic"/>
                <Line type="monotone" dataKey="base"        stroke={C.amberBrt} strokeWidth={2.5} dot={false} name="Base"/>
                <Line type="monotone" dataKey="pessimistic" stroke={C.red}     strokeWidth={2}   dot={false} name="Pessimistic"/>
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display:"flex",gap:18,marginTop:10 }}>
              {[{l:"Optimistic",c:C.teal},{l:"Base",c:C.amberBrt},{l:"Pessimistic",c:C.red}].map(x=>(
                <div key={x.l} style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <div style={{ width:16,height:2,background:x.c,borderRadius:1 }}/>

                  <span style={{ fontSize:TS.meta,color:C.t2,fontFamily:FONT,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em" }}>{x.l}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel accentColor={C.amber} accentSide="top">
            <Label>Market Share · Wearables California</Label>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={COMPETITORS} layout="vertical" margin={{top:0,right:10,left:0,bottom:0}}>
                <XAxis type="number" tick={{fill:C.t2,fontSize:TS.axis,fontFamily:FONT}} axisLine={false} tickLine={false} domain={[0,50]}/>

                <YAxis type="category" dataKey="name" tick={{fill:C.t2,fontSize:TS.bodySm,fontFamily:FONT,fontWeight:500}} axisLine={false} tickLine={false} width={100}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="share" radius={[0,3,3,0]} name="Share %">
                  {COMPETITORS.map((d,i)=><Cell key={i} fill={d.color} opacity={0.7}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>


        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10 }}>
          <Panel>
            <Label>Risk Heatmap · Competitive × Regulatory</Label>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:3,marginBottom:8 }}>
              {data.heatmap?.map((cell,i)=>{
                const q = Math.max(0,Math.min(1,(cell.roi+30)/80));
                const r = Math.round(200*(1-q)+20), g = Math.round(140*q+20), b = Math.round(60*q);
                return (
                  <div key={i} title={`ROI: ${cell.roi.toFixed(1)}%`} style={{
                    background:`rgba(${r},${g},${b},0.5)`,border:`1px solid rgba(${r},${g},${b},0.22)`,
                    borderRadius:4,height:38,display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:TS.meta,color:C.t1,fontFamily:FONT,fontWeight:600,
                  }}>{cell.roi.toFixed(0)}%</div>
                );
              })}
            </div>
            <div style={{ display:"flex",justifyContent:"space-between" }}>

              <span style={{ fontSize:TS.micro,color:C.t3,fontFamily:FONT,fontWeight:500,letterSpacing:"0.05em" }}>← Low Risk</span>
              <span style={{ fontSize:TS.micro,color:C.t3,fontFamily:FONT,fontWeight:500,letterSpacing:"0.05em" }}>High Risk →</span>
            </div>
          </Panel>
          <Panel>
            <Label>Scenario Breakdown</Label>
            <HBar label="Optimistic"  value={data.escenarios.optimista.prob}  color={C.teal}  right={`${fmt(data.escenarios.optimista.prob)}%  ROI ${fmt(data.escenarios.optimista.roi_promedio)}%`}/>
            <HBar label="Neutral"     value={data.escenarios.neutral.prob}    color={C.amber} right={`${fmt(data.escenarios.neutral.prob)}%  ROI ${fmt(data.escenarios.neutral.roi_promedio)}%`}/>
            <HBar label="Pessimistic" value={data.escenarios.pesimista.prob}  color={C.red}   right={`${fmt(data.escenarios.pesimista.prob)}%  ROI ${fmt(data.escenarios.pesimista.roi_promedio)}%`}/>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12,paddingTop:10,borderTop:`1px solid ${C.border}` }}>
              <KPI label="Median ROI" value={`${fmt(m.roi_mediana)}%`} color={C.teal}/>
              <KPI label="Std Dev"    value={`${fmt(m.std_roi)}%`}     color={C.amber}/>
            </div>
          </Panel>
        </div>


        <Panel accentColor={C.teal} accentSide="left" style={{ marginBottom:10 }}>
          <Label color={C.t2}>Airia Risk Analyst · Strategic Intelligence</Label>

          <div style={{ color:C.t2,fontSize:TS.body,lineHeight:1.85,fontWeight:400 }}>
            {data.insight||data.analisis?.recomendacion}
          </div>
        </Panel>

        {error && (
          <div style={{ background:C.redDeep,border:`1px solid ${C.red}30`,borderRadius:6,padding:"10px 14px",marginBottom:12,fontFamily:FONT }}>

            <span style={{ fontSize:TS.bodySm,color:C.t2,whiteSpace:"pre-line" }}>{error}</span>
          </div>
        )}

        {!optData && !decision && (
          <Btn onClick={runOptimize} disabled={optimizing} variant="tealOutline" style={{ marginBottom:10,width:"100%" }}>
            {optimizing?"Generating 5 Strategic Variants...":"Optimize Strategy →"}
          </Btn>
        )}

        {optData && !decision && (
          <Panel style={{ marginBottom:10 }}>
            <Label color={C.t2}>Strategy Comparison</Label>
            <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:FONT }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                  {["Strategy","ROI","Success","Worst","Revenue","Score"].map(h=>(
                    <th key={h} style={{
                      padding:"7px 10px",
                      color:C.t3,
                      fontWeight:600,
                      textAlign:"right",
                      fontSize:TS.tableHd,
                      letterSpacing:"0.08em",
                      textTransform:"uppercase",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {optData.variantes.map((v,i)=>{
                  const dom = v.tag===optData.estrategia_dominante.tag;
                  return (
                    <tr key={i} style={{ borderBottom:`1px solid ${C.divider}`,background:dom?`${C.teal}07`:"transparent" }}>
                      <td style={{ padding:"9px 10px",color:dom?C.t1:C.t2,fontSize:TS.tableRow,fontWeight:dom?600:400 }}>
                        {dom&&<span style={{color:C.teal,marginRight:4,fontSize:12}}>★</span>}
                        {v.nombre}
                      </td>
                      <td style={{ padding:"9px 10px",textAlign:"right",fontSize:TS.tableRow }}>
                        <span style={{ color:C.t1,fontWeight:600 }}>{fmt(v.metricas.roi_esperado)}%</span>
                        <span style={{ fontSize:TS.micro,marginLeft:3,color:v.metricas.roi_esperado>0?C.teal:C.red }}>
                          {v.metricas.roi_esperado>0?"▲":"▼"}
                        </span>
                      </td>
                      <td style={{ padding:"9px 10px",textAlign:"right",color:C.t1,fontSize:TS.tableRow }}>{fmt(v.metricas.prob_exito)}%</td>
                      <td style={{ padding:"9px 10px",textAlign:"right",color:C.t1,fontSize:TS.tableRow }}>{fmt(v.metricas.worst_case_roi)}%</td>

                      <td style={{ padding:"9px 10px",textAlign:"right",color:C.t2,fontSize:TS.tableRow }}>{fmtM(v.metricas.ingresos_esperados)}</td>
                      <td style={{ padding:"9px 10px",textAlign:"right",color:dom?C.t1:C.t3,fontWeight:dom?700:400,fontSize:TS.tableRow }}>{fmt(v.score)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        )}


        {!decision && (
          <Panel accentColor={C.teal} accentSide="left" style={{ marginBottom:10 }}>

            <div style={{ fontSize:TS.sectionHd,fontWeight:700,color:C.t1,fontFamily:FONT,marginBottom:8,letterSpacing:"-0.01em" }}>
              Human-in-the-Loop · Executive Decision
            </div>
            <div style={{ color:C.t2,fontSize:TS.body,lineHeight:1.8,marginBottom:18 }}>
              {optData
                ? optData.comparacion.mensaje_hitl
                : <>Simulation complete. Risk:{" "}
                    <span style={{color:C.t1,fontWeight:600}}>{data.analisis?.nivel_riesgo}</span>
                    {" "}— ROI:{" "}
                    <span style={{color:C.t1,fontWeight:600}}>{fmt(m.roi_esperado)}%</span>
                    {" "}— Success:{" "}
                    <span style={{color:C.t1,fontWeight:600}}>{fmt(m.prob_exito)}%</span>.
                    {" "}Make your executive decision below.
                  </>
              }
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
              <Btn onClick={()=>handleDecision("approved")} disabled={loadingHITL} variant="teal">
                {loadingHITL?"Processing...":"Approve Launch"}
              </Btn>
              <Btn onClick={()=>handleDecision("rejected")} disabled={loadingHITL} variant="redOutline">
                {loadingHITL?"Processing...":"Reject Launch"}
              </Btn>
            </div>
          </Panel>
        )}

        {decision && (
          <Panel accentColor={decision==="approved"?C.teal:C.red} accentSide="left" style={{ marginBottom:10 }}>
            <div style={{ fontSize:TS.sectionHd,fontWeight:700,color:C.t1,fontFamily:FONT,marginBottom:8 }}>
              {decision==="approved"?"Approved · Roadmap Activated":"Rejected · Report Generated"}
            </div>
            <div style={{ color:C.t2,fontSize:TS.body,lineHeight:1.8,marginBottom:16 }}>{hitlMsg}</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14 }}>
              {[{l:"PDF Report",s:"Generated"},{l:"Slack",s:"Notified"},{l:"Email",s:"Sent"}].map(item=>{
                const cc = decision==="approved"?C.teal:C.red;
                return (
                  <div key={item.l} style={{ background:`${cc}07`,border:`1px solid ${cc}1A`,borderRadius:6,padding:"12px",textAlign:"center" }}>

                    <div style={{ fontSize:TS.micro,color:C.t3,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600 }}>{item.l}</div>

                    <div style={{ fontSize:TS.bodySm,color:C.t1,fontWeight:700 }}>{item.s}</div>
                    <div style={{ width:4,height:4,borderRadius:"50%",background:cc,margin:"5px auto 0" }}/>
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex",gap:9 }}>
              <Btn onClick={()=>onNav("reports")} variant={decision==="approved"?"tealOutline":"redOutline"}>View Full Report →</Btn>
              <Btn onClick={()=>onNav("analysis")} variant="ghost">New Analysis</Btn>
            </div>
          </Panel>
        )}

      </div>


      <div style={{ marginTop:88 }}>
        <RightSidebar m={m} data={data}/>
      </div>
    </div>
  );
}