 
// Load jsPDF from CDN if not already loaded
function ensureJsPDF() {
  return new Promise((resolve) => {
    if (window.jspdf) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => resolve();
    s.onerror = () => resolve(); // resolve anyway, will fail gracefully later
    document.head.appendChild(s);
  });
}
 
// Shared jsPDF generator — used by ResultsPage and ReportsPage
export async function generateRiskRoomPDF(data, decision) {
  await ensureJsPDF();
  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) { alert("PDF library not available. Please try again."); return; }
 
    const doc      = new jsPDF({ unit:"pt", format:"letter" });
    const approved = decision === "approved";
    const acR=approved?0:229, acG=approved?201:57, acB=approved?160:53;
    const accent = `rgb(${acR},${acG},${acB})`;
 
    // Data sources — handle both old and new format
    const mc  = data.monte_carlo || {};
    const m   = data.metrics     || data.metricas || {};
    const rf  = data.risk_factors || [];
    const mit = data.mitigation  || data.mitigation_actions || [];
    const rec = data.recommendation || data.analisis?.nivel_riesgo || "REVIEW";
    const summary = data.executive_summary || data.analisis?.recomendacion || data.insight || "";
    const full    = data.full_analysis || data.insight || summary || "";
    const product = data.projectInfo || data.productText || "Product Launch Analysis";
 
    // Metrics — handle both formats
    const probExito    = mc.prob_exito    || m.probability_of_success || m.prob_exito    || 0;
    const roiEsp       = mc.roi_esperado  || m.roi_esperado  || 0;
    const bestCase     = mc.best_case_roi || m.best_case_roi || 0;
    const worstCase    = mc.worst_case_roi|| m.worst_case_roi|| 0;
    const var_          = mc.value_at_risk || m.value_at_risk || 0;
    const revenue      = mc.ingresos_esperados || m.ingresos_esperados || 0;
    const riskScore    = m.overall_risk_score  || 0;
    const marketAttr   = m.market_attractiveness || 0;
    const confidence   = m.confidence_level || 0;
 
    let y=0; const ml=45, mr=567, pw=mr-ml;
    const checkY=(n=18)=>{ if(y+n>730){doc.addPage();y=50;} };
 
    // ── PAGE 1 HEADER ────────────────────────────────────────────────────────
    // Dark header band
    doc.setFillColor(8,12,18); doc.rect(0,0,612,90,"F");
    // Accent line
    doc.setFillColor(acR,acG,acB); doc.rect(0,88,612,2,"F");
 
    // Logo / title
    doc.setFont("helvetica","bold"); doc.setFontSize(9);
    doc.setTextColor(acR,acG,acB);
    doc.text("RISKROOM", ml, 28, {charSpace:3});
 
    doc.setFontSize(20); doc.setTextColor(230,237,243);
    doc.text("Strategic Product Launch Analysis", ml, 50);
 
    doc.setFont("helvetica","normal"); doc.setFontSize(9);
    doc.setTextColor(107,122,141);
    doc.text(`${product.slice(0,70)}`, ml, 68);
    doc.text(`Generated: ${new Date().toLocaleString()}  |  Airia AI Multi-Agent Pipeline`, ml, 80);
 
    // Decision badge (top right)
    const badgeX = mr - 140, badgeY = 20;
    doc.setFillColor(acR,acG,acB,0.15); 
    doc.setDrawColor(acR,acG,acB);
    doc.roundedRect(badgeX, badgeY, 140, 52, 4, 4, "FD");
    doc.setFont("helvetica","bold"); doc.setFontSize(14);
    doc.setTextColor(acR,acG,acB);
    doc.text(approved?"✓ APPROVED":"✕ REJECTED", badgeX+70, badgeY+22, {align:"center"});
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(168,179,194);
    doc.text("Executive Decision", badgeX+70, badgeY+38, {align:"center"});
 
    y = 108;
 
    // ── EXECUTIVE SUMMARY ────────────────────────────────────────────────────
    doc.setFont("helvetica","bold"); doc.setFontSize(10);
    doc.setTextColor(acR,acG,acB); doc.text("EXECUTIVE SUMMARY", ml, y);
    doc.setFillColor(acR,acG,acB); doc.rect(ml, y+3, 30, 1, "F");
    y += 16;
 
    doc.setFont("helvetica","normal"); doc.setFontSize(9.5);
    doc.setTextColor(168,179,194);
    const sumLines = doc.splitTextToSize(summary || "No summary available.", pw);
    sumLines.forEach(l=>{checkY();doc.text(l,ml,y);y+=14;}); y+=10;
 
    // ── KEY METRICS GRID ─────────────────────────────────────────────────────
    checkY(80);
    doc.setFont("helvetica","bold"); doc.setFontSize(10);
    doc.setTextColor(acR,acG,acB); doc.text("KEY METRICS", ml, y);
    doc.setFillColor(acR,acG,acB); doc.rect(ml, y+3, 30, 1, "F");
    y += 16;
 
    const metrics = [
      { label:"Recommendation",       value: rec,                           sub:"Airia AI verdict" },
      { label:"Success Probability",  value: `${Number(probExito).toFixed(1)}%`,  sub:`Monte Carlo P50` },
      { label:"Expected ROI",         value: `${Number(roiEsp).toFixed(1)}%`,     sub:`500 simulations` },
      { label:"Overall Risk Score",   value: `${riskScore}/100`,            sub:"Lower is better" },
      { label:"Best Case (P95)",      value: `${Number(bestCase).toFixed(1)}%`,   sub:"Optimistic scenario" },
      { label:"Worst Case (P5)",      value: `${Number(worstCase).toFixed(1)}%`,  sub:"Downside scenario" },
      { label:"Value at Risk",        value: `$${Number(var_).toFixed(2)}M`,      sub:"5th percentile loss" },
      { label:"Expected Revenue",     value: `$${Number(revenue).toFixed(2)}M`,   sub:"Base case" },
      { label:"Market Attractiveness",value: `${marketAttr}/10`,           sub:"Airia score" },
      { label:"Confidence Level",     value: `${confidence}%`,              sub:"Pipeline confidence" },
    ];
 
    const cols = 2, colW = pw / cols, rowH = 36;
    metrics.forEach((item, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = ml + col * colW, iy = y + row * rowH;
      checkY(rowH);
 
      // Card background
      const even = Math.floor(i/cols)%2===0;
      doc.setFillColor(even?15:11, even?20:15, even?26:20);
      doc.rect(x, iy-12, colW-4, rowH-2, "F");
 
      // Label
      doc.setFont("helvetica","normal"); doc.setFontSize(8);
      doc.setTextColor(107,122,141); doc.text(item.label, x+8, iy);
 
      // Value
      doc.setFont("helvetica","bold"); doc.setFontSize(13);
      doc.setTextColor(230,237,243); doc.text(item.value, x+8, iy+14);
 
      // Sub
      doc.setFont("helvetica","normal"); doc.setFontSize(7.5);
      doc.setTextColor(acR,acG,acB); doc.text(item.sub, x+8, iy+24);
    });
 
    y += Math.ceil(metrics.length / cols) * rowH + 12;
 
    // ── RISK FACTORS ─────────────────────────────────────────────────────────
    if (rf.length > 0) {
      checkY(50);
      doc.setFont("helvetica","bold"); doc.setFontSize(10);
      doc.setTextColor(acR,acG,acB); doc.text("RISK FACTORS", ml, y);
      doc.setFillColor(acR,acG,acB); doc.rect(ml, y+3, 30, 1, "F");
      y += 16;
 
      rf.forEach((r, i) => {
        const sev = r.severity || 0;
        const [rr,rg,rb] = sev>=8?[229,57,53]:sev>=5?[229,160,32]:[0,201,160];
        checkY(30);
 
        // Severity bar background
        doc.setFillColor(15,20,26); doc.rect(ml, y-12, pw, 28, "F");
 
        // Severity indicator
        const barW = (sev/10) * 60;
        doc.setFillColor(rr,rg,rb,0.3); doc.rect(ml+pw-70, y-8, 60, 6, "F");
        doc.setFillColor(rr,rg,rb); doc.rect(ml+pw-70, y-8, barW, 6, "F");
 
        // Name + severity
        doc.setFont("helvetica","bold"); doc.setFontSize(9);
        doc.setTextColor(rr,rg,rb); doc.text(`${r.name||""} — ${sev}/10`, ml+8, y);
 
        // Description
        doc.setFont("helvetica","normal"); doc.setFontSize(8.5);
        doc.setTextColor(168,179,194);
        const descLines = doc.splitTextToSize(r.description||"", pw-90);
        descLines.slice(0,1).forEach(l => doc.text(l, ml+8, y+11));
        y += 28;
      });
      y += 8;
    }
 
    // ── MITIGATION ACTIONS ────────────────────────────────────────────────────
    if (mit.length > 0 && approved) {
      checkY(50);
      doc.setFont("helvetica","bold"); doc.setFontSize(10);
      doc.setTextColor(acR,acG,acB); doc.text("MITIGATION ACTIONS", ml, y);
      doc.setFillColor(acR,acG,acB); doc.rect(ml, y+3, 30, 1, "F");
      y += 16;
 
      mit.forEach((a, i) => {
        checkY(24);
        doc.setFillColor(i%2===0?15:11, i%2===0?20:15, i%2===0?26:20);
        doc.rect(ml, y-12, pw, 22, "F");
 
        // Priority badge
        doc.setFillColor(acR,acG,acB);
        doc.roundedRect(ml+6, y-9, 20, 14, 2, 2, "F");
        doc.setFont("helvetica","bold"); doc.setFontSize(8);
        doc.setTextColor(8,12,18);
        doc.text(`P${a.priority||i+1}`, ml+16, y+1, {align:"center"});
 
        // Action text
        doc.setFont("helvetica","normal"); doc.setFontSize(8.5);
        doc.setTextColor(168,179,194);
        const actLines = doc.splitTextToSize(a.action||"", pw-80);
        actLines.slice(0,1).forEach(l => doc.text(l, ml+34, y));
 
        // Timeline
        doc.setFont("helvetica","bold"); doc.setFontSize(7.5);
        doc.setTextColor(acR,acG,acB);
        doc.text(a.timeline||"", mr-6, y, {align:"right"});
 
        y += 22;
      });
      y += 8;
    }
 
    // ── FULL ANALYSIS ─────────────────────────────────────────────────────────
    if (full && full.length > 20) {
      checkY(50);
      doc.setFont("helvetica","bold"); doc.setFontSize(10);
      doc.setTextColor(acR,acG,acB); doc.text("FULL STRATEGIC ANALYSIS", ml, y);
      doc.setFillColor(acR,acG,acB); doc.rect(ml, y+3, 30, 1, "F");
      y += 16;
 
      doc.setFont("helvetica","normal"); doc.setFontSize(9);
      doc.setTextColor(168,179,194);
      const cleanFull = full.replace(/[#*`_]/g,"").replace(/\n/g," ");
      const fullLines = doc.splitTextToSize(cleanFull, pw);
      fullLines.forEach(l=>{checkY();doc.text(l,ml,y);y+=13;});
      y += 8;
    }
 
    // ── FOOTER on every page ──────────────────────────────────────────────────
    const pages = doc.internal.getNumberOfPages();
    for (let i=1; i<=pages; i++) {
      doc.setPage(i);
      doc.setFillColor(8,12,18); doc.rect(0,758,612,84,"F");
      doc.setFillColor(acR,acG,acB); doc.rect(0,758,612,1,"F");
      doc.setFont("helvetica","normal"); doc.setFontSize(7.5);
      doc.setTextColor(107,122,141);
      doc.text("RiskRoom — Strategic Decisions, Quantified", ml, 772);
      doc.text("Powered by Airia AI Multi-Agent Pipeline  |  Hackathon 2026", ml, 783);
      doc.setFont("helvetica","bold"); doc.setTextColor(acR,acG,acB);
      doc.text(`Page ${i} of ${pages}`, mr, 772, {align:"right"});
    }
 
    const fname = `RiskRoom_${approved?"Approval":"Rejection"}_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(fname);
    return fname;
  } catch(e) {
    console.error("PDF generation error:", e);
    alert("PDF error: " + e.message);
    return null;
  }
}