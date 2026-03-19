// RISKROOM THEME
// Design tokens for the application

// Typography - font family
export const FONT = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// Color System
export const C = {

  // Backgrounds (dark base)
  bg:       "#0B0F14",
  bg2:      "#0F141A",
  bg3:      "#111920",
  panel:    "#121821",
  panel2:   "#171F2B",
  overlay:  "#1A2231",

  // Borders & dividers
  border:   "#1F2A36",
  border2:  "#263445",
  divider:  "#1A2436",

  // Text hierarchy
  t1:       "#E6EDF3",
  t2:       "#A8B3C2",
  t3:       "#6B7A8D",
  t4:       "#3A4A5C",

  // Legacy aliases
  white:    "#E6EDF3",
  gray:     "#A8B3C2",
  grayMid:  "#6B7A8D",
  grayDim:  "#3A4A5C",

  // Accent: Positive / Primary
  teal:     "#00C9A0",
  tealBrt:  "#00E5A8",
  tealDim:  "#00A07E",
  tealDeep: "#004A3A",

  // Accent: Informational
  blue:     "#00B4E5",
  blueDim:  "#007BAA",

  // Danger: Negative / Risk
  red:      "#E53935",
  redBrt:   "#FF3B3B",
  redMid:   "#C0392B",
  redDeep:  "#2E0E0E",

  // Warning
  amber:    "#E5A020",
  amberBrt: "#FFB020",
  amberDim: "#9A6D10",

  // Chart infrastructure
  chartGrid: "#1A2636",
};

// Shadow System
export const SHADOW = {
  card:     "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)",
  elevated: "0 4px 24px rgba(0,0,0,0.5)",
  glowTeal: "0 0 14px rgba(0,229,168,0.18)",
  glowRed:  "0 0 12px rgba(255,59,59,0.15)",
  glowAmber:"0 0 10px rgba(255,176,32,0.13)",
};

// Global CSS string
export const GLOBAL_STYLES = `
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
  body { margin: 0; padding: 0; background: #0B0F14; color: #E6EDF3; }
  input, button, textarea, select { font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #0B0F14; }
  ::-webkit-scrollbar-thumb { background: #1F2A36; border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: #263445; }
`;
