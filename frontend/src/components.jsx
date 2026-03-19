import React from "react";
import { C, FONT } from "./theme.js";

// Type scale configuration
const TS = {
  kpiLabel:   13,
  kpiValueLg: 32,
  kpiValueMd: 24,
  kpiSub:     12,
  gaugeLabel: 12,
  hbarLabel:  13,
  hbarValue:  13,
  sliderLabel:13,
  sliderValue:15,
  btnText:    12,
  inputLabel: 12,
  inputText:  14,
  tagNormal:  11,
  tagLarge:   13,
  agentName:  13,
  agentStatus:11,
};

// Background glow effects component
export function Glows() {
  return (
    <>
      <div style={{ position:"fixed", left:"-8%",  top:"-8%",    width:700, height:700, background:`radial-gradient(circle,rgba(224,48,32,0.15) 0%,rgba(224,48,32,0.04) 40%,transparent 70%)`,  pointerEvents:"none", zIndex:0, borderRadius:"50%" }} />
      <div style={{ position:"fixed", right:"-8%", bottom:"-8%", width:700, height:700, background:`radial-gradient(circle,rgba(0,184,160,0.12) 0%,rgba(0,184,160,0.03) 40%,transparent 70%)`, pointerEvents:"none", zIndex:0, borderRadius:"50%" }} />
      <div style={{ position:"fixed", left:"42%",  top:"30%",    width:500, height:500, background:`radial-gradient(circle,rgba(0,160,140,0.04) 0%,transparent 70%)`, pointerEvents:"none", zIndex:0, borderRadius:"50%", transform:"translate(-50%,-50%)" }} />
      <div style={{ position:"fixed", right:"28%", top:"0",      width:400, height:400, background:`radial-gradient(circle,rgba(200,50,20,0.05) 0%,transparent 70%)`, pointerEvents:"none", zIndex:0, borderRadius:"50%" }} />
    </>
  );
}

// Panel component - card container
export function Panel({ children, style, accentColor, accentSide }) {
  const side = accentSide || "top";
  const ac   = accentColor;
  const borderAccent = ac ? {
    top:    { borderTop:    `2px solid ${ac}` },
    left:   { borderLeft:   `2px solid ${ac}` },
    bottom: { borderBottom: `2px solid ${ac}` },
  }[side] : {};

  return (
    <div style={{
      background: C.panel,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: "14px 16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)",
      ...borderAccent,
      ...style,
    }}>
      {children}
    </div>
  );
}

// Label component - section header
export function Label({ children, color, style }) {
  return (
    <div style={{
      fontSize: 13,
      color: color || C.t3,
      letterSpacing: "0.12em",
      marginBottom: 10,
      textTransform: "uppercase",
      fontFamily: FONT,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: 8,
      ...style,
    }}>
      {color && (
        <div style={{ width: 2, height: 12, background: color, borderRadius: 1, flexShrink: 0 }} />
      )}
      {children}
    </div>
  );
}

// KPI Card component
export function KPI({ label, value, sub, color = C.t1, glow, large }) {
  return (
    <div style={{
      background: C.panel,
      border: `1px solid ${C.border}`,
      borderRadius: 7,
      padding: "13px 15px",
      position: "relative",
      overflow: "hidden",
      boxShadow: glow ? `0 0 18px ${color}18` : "0 1px 3px rgba(0,0,0,0.4)",
    }}>
      {glow && (
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${color}60,transparent)` }} />
      )}

      <div style={{
        color: C.t2,
        fontSize: TS.kpiLabel,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontFamily: FONT,
        fontWeight: 500,
        marginBottom: 6,
      }}>
        {label}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{
          color: C.t1,
          fontSize: large ? TS.kpiValueLg : TS.kpiValueMd,
          fontWeight: 700,
          fontFamily: FONT,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
        }}>
          {value}
        </span>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block", marginBottom: 3, flexShrink: 0 }} />
      </div>

      {sub && (
        <div style={{ color: C.t3, fontSize: TS.kpiSub, marginTop: 5, fontFamily: FONT, fontWeight: 500 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// Radial Gauge component
export function RadialGauge({ value, label, color, size = 110 }) {
  const c    = color || (value >= 65 ? C.teal : value >= 40 ? C.amber : C.red);
  const r    = size * 0.40;
  const circ = 2 * Math.PI * r;
  const off  = circ - (Math.min(value, 100) / 100) * circ;
  const cx   = size / 2;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={C.border2} strokeWidth="6" />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={c} strokeWidth="6"
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={off}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cx})`}
          style={{ filter: `drop-shadow(0 0 5px ${c}40)`, transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
        <text x={cx} y={cx + 3} textAnchor="middle" dominantBaseline="middle"
          fill={C.t1} fontSize={size * 0.20} fontWeight="700" fontFamily={FONT}>
          {Math.round(value)}
        </text>
        <text x={cx} y={cx + size * 0.19} textAnchor="middle" dominantBaseline="middle"
          fill={C.t2} fontSize={size * 0.09} fontFamily={FONT} fontWeight="600">
          %
        </text>
      </svg>
      <div style={{
        color: C.t2,
        fontSize: TS.gaugeLabel,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontFamily: FONT,
        fontWeight: 600,
        textAlign: "center",
      }}>
        {label}
      </div>
    </div>
  );
}

// Horizontal Bar component
export function HBar({ label, value, max = 100, color, right }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <span style={{ fontSize: TS.hbarLabel, color: C.t2, fontFamily: FONT, fontWeight: 500 }}>
          {label}
        </span>
        <span style={{ fontSize: TS.hbarValue, color: C.t1, fontFamily: FONT, fontWeight: 600 }}>
          {right || `${typeof value === "number" && value < 10 ? value.toFixed(1) : Math.round(value)}%`}
        </span>
      </div>
      <div style={{ height: 4, background: C.border2, borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}50, ${color})`,
          borderRadius: 2, opacity: 0.9,
          transition: "width 1.4s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
    </div>
  );
}

// Slider component
export function Slider({ label, name, min, max, step, value, onChange, format }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ color: C.t2, fontSize: TS.sliderLabel, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: FONT, fontWeight: 500 }}>
          {label}
        </span>
        <span style={{ color: C.t1, fontSize: TS.sliderValue, fontWeight: 700, fontFamily: FONT }}>
          {format ? format(value) : value}
        </span>
      </div>
      <div style={{ position: "relative", height: 4, background: C.border2, borderRadius: 2 }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${C.redDeep}, ${C.red})`,
          borderRadius: 2, transition: "width 0.1s",
        }} />
        <div style={{
          position: "absolute", top: "50%", left: `${pct}%`,
          width: 10, height: 10, borderRadius: "50%",
          background: C.red,
          transform: "translate(-50%,-50%)",
          boxShadow: `0 0 8px ${C.red}60`,
        }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(name, parseFloat(e.target.value))}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }} />
      </div>
    </div>
  );
}

// Button component
export function Btn({ children, onClick, disabled, variant = "red", style }) {
  const variants = {
    red:        { bg: C.red,   border: C.red,   color: C.bg,  shadow: C.red  },
    teal:       { bg: C.teal,  border: C.teal,  color: C.bg,  shadow: C.teal },
    ghost:      { bg: "transparent", border: C.border, color: C.t2,  shadow: "transparent" },
    tealOutline:{ bg: "transparent", border: C.teal,  color: C.teal, shadow: C.teal },
    redOutline: { bg: "transparent", border: C.red,   color: C.red,  shadow: C.red  },
  };
  const v = variants[variant] || variants.red;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 0",
        background: disabled ? C.bg2 : v.bg,
        border: `1px solid ${disabled ? C.border : v.border}`,
        borderRadius: 6,
        color: disabled ? C.t3 : v.color,
        fontSize: TS.btnText,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: FONT,
        width: "100%",
        transition: "all 0.15s",
        boxShadow: disabled ? "none" : `0 0 14px ${v.shadow}25`,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// Input component
export function Input({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <div style={{
          fontSize: TS.inputLabel,
          color: C.t2,
          letterSpacing: "0.1em",
          marginBottom: 5,
          textTransform: "uppercase",
          fontFamily: FONT,
          fontWeight: 500,
        }}>
          {label}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: C.bg2,
          border: `1px solid ${C.border}`,
          borderRadius: 5,
          padding: "10px 12px",
          color: C.t1,
          fontSize: TS.inputText,
          fontFamily: FONT,
          outline: "none",
          transition: "border 0.15s",
          boxSizing: "border-box",
        }}
        onFocus={e => e.target.style.borderColor = C.teal}
        onBlur={e  => e.target.style.borderColor = C.border}
      />
    </div>
  );
}

// Tag component
export function Tag({ label, color, size = "normal" }) {
  const c = color || C.teal;
  const isLarge = size === "large";
  return (
    <span style={{
      background: `${c}12`,
      border: `1px solid ${c}40`,
      borderRadius: 3,
      padding: isLarge ? "6px 14px" : "3px 8px",
      fontSize: isLarge ? TS.tagLarge : TS.tagNormal,
      color: c,
      fontFamily: FONT,
      letterSpacing: "0.08em",
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {label}
    </span>
  );
}

// Agent Row component
export function AgentRow({ name, status }) {
  const colors = { idle: C.t4, running: C.amber, done: C.teal };
  const labels = { idle: "Idle", running: "Active", done: "Done" };
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "5px 0",
      borderBottom: `1px solid ${C.divider}`,
    }}>
      <span style={{
        fontSize: TS.agentName,
        color: status === "idle" ? C.t2 : C.t1,
        fontFamily: FONT,
        fontWeight: status === "idle" ? 400 : 500,
      }}>
        {name}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{
          width: 5, height: 5, borderRadius: "50%",
          background: colors[status],
          boxShadow: status !== "idle" ? `0 0 6px ${colors[status]}` : "none",
        }} />
        <span style={{ fontSize: TS.agentStatus, color: colors[status], fontFamily: FONT, fontWeight: 500 }}>
          {labels[status]}
        </span>
      </div>
    </div>
  );
}

// Spinner component
export function Spinner({ size = 32 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${C.border}`,
      borderTop: `2px solid ${C.red}`,
      borderRight: `2px solid ${C.teal}`,
      borderRadius: "50%",
      animation: "spin 0.85s linear infinite",
    }} />
  );
}
