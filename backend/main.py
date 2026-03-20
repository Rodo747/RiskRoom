import os, json, uuid, asyncio, base64
from datetime import datetime

import httpx
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Configuration constants
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
AIRIA_PIPELINE_ID = os.getenv("AIRIA_PIPELINE_ID", "")
AIRIA_PIPELINE_VERSION = os.getenv("AIRIA_PIPELINE_VERSION", "0.02")

# Initialize FastAPI application
app = FastAPI(title="RiskRoom Monte Carlo Engine", version="1.0.0")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ────────────────────────────────────────────────────────────────────
class AnalysisInput(BaseModel):
    project_info: str; company_info: str
    precio: float = 299.0; costo_unitario: float = 120.0; costo_logistico: float = 25.0
    presupuesto_marketing: float = 500000.0; elasticidad: float = 1.4
    agresividad_competitiva: float = 0.5; riesgo_regulatorio: float = 0.3
    tamano_mercado_estimado: int = 500000; shock_macro: bool = False
    competitor_price_war: bool = False

class DecisionInput(BaseModel):
    decision: str  # "approved" or "rejected"

# ── Monte Carlo ───────────────────────────────────────────────────────────────
def run_monte_carlo(p):
    np.random.seed(int.from_bytes(os.urandom(4), "big"))
    n = 500
    a   = min(p.agresividad_competitiva*(1.8 if p.competitor_price_war else 1.0), 1.0)
    pr  = np.random.normal(p.precio, p.precio*0.05, n)
    pen = np.clip(np.random.beta(2,20,n)*(0.04+(p.presupuesto_marketing/10_000_000)*0.06)*25*(1-np.random.normal(a*0.3,0.05,n)),0.001,0.25)
    fr  = np.where(np.random.random(n)<p.riesgo_regulatorio, np.random.uniform(0.4,0.75,n), 1.0)
    u   = np.maximum((p.tamano_mercado_estimado*pen*fr).astype(int), 0)
    ing = pr*u; cos = (p.costo_unitario+p.costo_logistico)*u+p.presupuesto_marketing
    util= ing-cos; roi = (util/cos)*100
    hist, edges = np.histogram(roi, bins=40)
    return {
        "prob_exito":         round(float(np.mean(roi>0)*100),1),
        "roi_esperado":       round(float(np.mean(roi)),1),
        "worst_case_roi":     round(float(np.percentile(roi,5)),1),
        "best_case_roi":      round(float(np.percentile(roi,95)),1),
        "value_at_risk":      round(float(np.percentile(util,5))/1_000_000,2),
        "ingresos_esperados": round(float(np.mean(ing))/1_000_000,2),
        "utilidad_esperada":  round(float(np.mean(util))/1_000_000,2),
        "std_roi":            round(float(np.std(roi)),1),
        "distribution":       [{"roi":round(float((edges[i]+edges[i+1])/2),1),"frecuencia":int(hist[i])} for i in range(len(hist))],
    }

# ── Helpers ───────────────────────────────────────────────────────────────────
def _parse(text):
    t = text.strip()
    if "```" in t:
        for p in t.split("```"):
            c = p.lstrip("json").strip()
            if c.startswith("{"): t = c; break
    try: return json.loads(t)
    except: return {"full_analysis": text, "recommendation": _rec(text)}

def _rec(text):
    u = text.upper()
    for line in reversed(text.strip().splitlines()):
        l = line.strip().upper()
        if len(l) < 80:
            if "PROCEED" in l: return "PROCEED"
            if "REJECT"  in l: return "REJECT"
            if "REVIEW"  in l: return "REVIEW"
    return "PROCEED" if "PROCEED" in u else "REJECT" if "REJECT" in u else "REVIEW"

def _prompt(inp, mc):
    return f"""project_info: {inp.project_info}

company_info: {inp.company_info}

monte_carlo_results (500 simulations):
- Success probability: {mc['prob_exito']}%
- Expected ROI: {mc['roi_esperado']}%
- Worst case (P5): {mc['worst_case_roi']}%
- Best case (P95): {mc['best_case_roi']}%
- Value at Risk: ${mc['value_at_risk']}M
- Expected revenue: ${mc['ingresos_esperados']}M
- Price: ${inp.precio} | Unit cost: ${inp.costo_unitario}
- Market size: {inp.tamano_mercado_estimado:,} units
- Competitive threat: {round(inp.agresividad_competitiva*100)}%
- Regulatory risk: {round(inp.riesgo_regulatorio*100)}%"""

def _save(job_id, raw, mc):
    if isinstance(raw, str): data = _parse(raw)
    elif isinstance(raw, dict): data = raw
    else: data = {"full_analysis": str(raw), "recommendation": "REVIEW"}
    eid = JOBS[job_id].get("airia_execution_id","")
    JOBS[job_id] = {
        "status":            "waiting_approval",
        "airia_execution_id": eid,
        "airia_connected":   True,
        "recommendation":    data.get("recommendation", _rec(str(raw))),
        "metrics":           data.get("metrics", {}),
        "risk_factors":      data.get("risk_factors", []),
        "scenarios":         data.get("scenarios", {}),
        "geographic":        data.get("geographic_analysis", []),
        "mitigation":        data.get("mitigation_actions", []),
        "executive_summary": data.get("executive_summary", ""),
        "full_analysis":     data.get("full_analysis", str(raw)),
        "monte_carlo":       mc,
        "timestamp":         datetime.now().isoformat(),
    }
    print(f"[{job_id}] SAVED | rec={JOBS[job_id]['recommendation']}")

# ── Pipeline 1: Analysis ──────────────────────────────────────────────────────
async def _run_analysis(job_id: str, user_input: str, mc: dict):
    JOBS[job_id]["status"] = "running"
    print(f"[{job_id}] Pipeline 1: Analysis...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 800,
                    "messages": [{
                        "role": "user",
                        "content": f"""Eres Risk Analyst de RiskRoom. Analiza estos resultados de simulacion Monte Carlo:

- ROI Esperado: {input.metricas.get('roi_esperado', 'N/A')}%
- Probabilidad de Exito: {input.metricas.get('prob_exito', 'N/A')}%
- Peor Caso (P5): {input.metricas.get('worst_case_roi', 'N/A')}%
- Value at Risk: ${input.metricas.get('value_at_risk', 'N/A')}M
- Nivel de Riesgo: {input.nivel_riesgo}
{f'- Producto: {input.product_description}' if input.product_description else ''}

Proporciona un analisis ejecutivo en 3 oraciones directas y cuantitativas. Escribe en espanol profesional. Incluye una recomendacion concreta de accion."""
                    }]
                },
                timeout=30.0
            )

            if response.status_code == 200:
                data = response.json()
                insight = data.get("content", [{}])[0].get("text", "")
                return {"status": "success", "insight": insight}
            else:
                return {
                    "status": "success",
                    "insight": f"Error de API ({response.status_code}). Analisis local: ROI {input.metricas.get('roi_esperado')}%, Exito {input.metricas.get('prob_exito')}%, Riesgo {input.nivel_riesgo}."
                }

    except Exception as e:
        return {
            "status": "success",
            "insight": f"Analisis: ROI esperado {input.metricas.get('roi_esperado')}% con {input.metricas.get('prob_exito')}% de exito. Nivel de riesgo {input.nivel_riesgo}. Se recomienda evaluacion detallada."
        }


# Slack notification endpoint
@app.post("/notify-slack")
async def notify_slack(input: SlackNotifyInput):
    if not SLACK_WEBHOOK_URL:
        return {"status": "success", "message": "Slack webhook not configured (skipped)"}

    # Prepare notification payload
    decision_emoji = ":white_check_mark:" if input.decision == "approved" else ":x:"
    decision_text = "APROBADO" if input.decision == "approved" else "RECHAZADO"
    color = "#00b8a0" if input.decision == "approved" else "#e03020"

    payload = {
        "attachments": [{
            "color": color,
            "title": f"RiskRoom: Lanzamiento {decision_text}",
            "fields": [
                {"title": "Producto", "value": input.product_name, "short": True},
                {"title": "Decision", "value": f"{decision_emoji} {decision_text}", "short": True},
                {"title": "ROI Esperado", "value": f"{input.roi_esperado}%", "short": True},
                {"title": "Prob. Exito", "value": f"{input.prob_exito}%", "short": True},
                {"title": "Nivel de Riesgo", "value": input.nivel_riesgo, "short": True},
                {"title": "Timestamp", "value": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "short": True},
            ],
            "footer": "RiskRoom Monte Carlo Engine",
            "footer_icon": "https://riskroom.ai/icon.png"
        }]
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(SLACK_WEBHOOK_URL, json=payload, timeout=10.0)
            if response.status_code == 200:
                return {"status": "success", "message": "Slack notification sent"}
            else:
                return {"status": "error", "message": f"Slack API error: {response.status_code}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# PDF generation endpoint
@app.post("/generate-pdf")
async def generate_pdf(input: PDFGenerateInput):
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT

    # Create PDF document
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)

    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#e03020'),
        spaceAfter=12,
        alignment=TA_CENTER
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#00b8a0'),
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = styles['Normal']

    elements = []

    # Add title and metadata
    decision_title = "EXECUTIVE APPROVAL REPORT" if input.decision == "approved" else "REJECTION ANALYSIS REPORT"
    elements.append(Paragraph(f"RiskRoom: {decision_title}", title_style))
    elements.append(Paragraph(f"Product: {input.product_name}", body_style))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", body_style))
    elements.append(Spacer(1, 0.3*inch))

    # Add risk classification
    risk_color = colors.HexColor('#00cc66') if input.analisis.get('nivel_riesgo') == 'BAJO' else \
                 colors.HexColor('#dd8800') if input.analisis.get('nivel_riesgo') == 'MEDIO' else \
                 colors.HexColor('#ff4422')

    elements.append(Paragraph("RISK CLASSIFICATION", heading_style))
    elements.append(Paragraph(f"Level: {input.analisis.get('nivel_riesgo', 'N/A')}", body_style))
    elements.append(Paragraph(f"Recommendation: {input.analisis.get('recomendacion', 'N/A')}", body_style))
    elements.append(Spacer(1, 0.2*inch))

    # Add metrics table
    elements.append(Paragraph("KEY METRICS", heading_style))

    m = input.metricas
    metrics_data = [
        ['Metric', 'Value'],
        ['Expected ROI', f"{m.get('roi_esperado', 'N/A')}%"],
        ['Success Probability', f"{m.get('prob_exito', 'N/A')}%"],
        ['Worst Case (P5)', f"{m.get('worst_case_roi', 'N/A')}%"],
        ['Best Case (P95)', f"{m.get('best_case_roi', 'N/A')}%"],
        ['Value at Risk', f"${m.get('value_at_risk', 'N/A')}M"],
        ['Expected Revenue', f"${m.get('ingresos_esperados', 'N/A')}M"],
        ['Expected Profit', f"${m.get('utilidad_esperada', 'N/A')}M"],
        ['Std Deviation', f"{m.get('std_roi', 'N/A')}%"],
    ]

    table = Table(metrics_data, colWidths=[3*inch, 2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0e1c20')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#00b8a0')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#0c1618')),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#d8f0ec')),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#162830')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#0c1618'), colors.HexColor('#080f11')]),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 0.3*inch))

    # Add AI insight if available
    if input.insight:
        elements.append(Paragraph("AI ANALYSIS", heading_style))
        elements.append(Paragraph(input.insight, body_style))
        elements.append(Spacer(1, 0.2*inch))

    # Add executive decision
    elements.append(Paragraph("EXECUTIVE DECISION", heading_style))
    decision_text = "APPROVED - Roadmap activated, notifications sent." if input.decision == "approved" else "REJECTED - Launch cancelled, report generated."
    elements.append(Paragraph(decision_text, body_style))
    elements.append(Spacer(1, 0.2*inch))

    # Add footer
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("RiskRoom - Strategic Decisions, Quantified", ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#4a8880'),
        alignment=TA_CENTER
    )))
    elements.append(Paragraph("Airia AI Agents Hackathon 2026 - Track 2: Active Agents", ParagraphStyle(
        'FooterSmall',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#2a5850'),
        alignment=TA_CENTER
    )))

    # Build and return PDF
    doc.build(elements)
    buffer.seek(0)

    filename = f"riskroom_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# Airia pipeline proxy endpoint
@app.post("/run-analysis")
async def run_analysis(params: SimulationInput):
    # Step 1: Run Monte Carlo locally
    monte_carlo_results = run_monte_carlo(params)
    metricas = monte_carlo_results["metricas"]

    # Step 2: Classify risk locally as fallback
    roi_e = metricas["roi_esperado"]
    prob  = metricas["prob_exito"]
    if prob >= 70 and roi_e >= 25:
        nivel_riesgo  = "BAJO"
        recomendacion = "Estrategia viable. Proceder con lanzamiento controlado."
    elif prob >= 50 and roi_e >= 10:
        nivel_riesgo  = "MEDIO"
        recomendacion = "Estrategia aceptable. Revisar pricing y mitigar riesgo regulatorio."
    elif prob >= 35:
        nivel_riesgo  = "ALTO"
        recomendacion = "Estrategia riesgosa. Optimizar supuestos antes de ejecutar."
    else:
        nivel_riesgo  = "CRITICO"
        recomendacion = "No ejecutar con supuestos actuales. Requiere reestructuracion."

    # Step 3: Generate heatmap
    heatmap = []
    for comp in [0.1, 0.3, 0.5, 0.7, 0.9]:
        for reg in [0.1, 0.3, 0.5, 0.7, 0.9]:
            p = params.model_copy()
            p.agresividad_competitiva = comp
            p.riesgo_regulatorio = reg
            r = run_monte_carlo(p)
            heatmap.append({
                "competitivo": comp,
                "regulatorio": reg,
                "roi": r["metricas"]["roi_esperado"],
                "prob_exito": r["metricas"]["prob_exito"],
            })

    # Step 4: Call Airia pipeline
    airia_insight = None
    if AIRIA_API_KEY and AIRIA_PIPELINE_ID:
        try:
            airia_input = f"""Analiza el lanzamiento de este producto:

Producto: {params.product_description or 'Smartwatch fitness premium'}
Precio: ${params.precio}
Costo unitario: ${params.costo_unitario}
Mercado estimado: {params.tamano_mercado_estimado} unidades
Presupuesto marketing: ${params.presupuesto_marketing}
Riesgo regulatorio: {params.riesgo_regulatorio * 100}%
Agresividad competitiva: {params.agresividad_competitiva * 100}%

Resultados Monte Carlo (500 simulaciones):
- ROI esperado: {metricas['roi_esperado']}%
- Probabilidad de exito: {metricas['prob_exito']}%
- Peor caso (P5): {metricas['worst_case_roi']}%
- Mejor caso (P95): {metricas['best_case_roi']}%
- Value at Risk: ${metricas['value_at_risk']}M
- Nivel de riesgo: {nivel_riesgo}

Proporciona un analisis ejecutivo estrategico con recomendaciones concretas."""

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://api.airia.com/v1/pipelines/{AIRIA_PIPELINE_ID}/execute",
                    headers={
                        "Authorization": f"Bearer {AIRIA_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "input": airia_input,
                        "version": AIRIA_PIPELINE_VERSION,
                    },
                    timeout=60.0,
                )
                if response.status_code == 200:
                    airia_data = response.json()
                    # Airia returns output in different fields depending on pipeline
                    airia_insight = (
                        airia_data.get("output") or
                        airia_data.get("result") or
                        airia_data.get("response") or
                        airia_data.get("content") or
                        str(airia_data)
                    )
                else:
                    print(f"Airia error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Airia call failed: {e}")

    return {
        "status": "success",
        "data": {
            **monte_carlo_results,
            "analisis": {
                "nivel_riesgo": nivel_riesgo,
                "recomendacion": recomendacion,
            },
            "heatmap": heatmap,
            "insight": airia_insight or recomendacion,
            "airia_connected": airia_insight is not None,
        }
    }
# Health check endpoint
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "config": {
            "anthropic_key_set": bool(ANTHROPIC_API_KEY),
            "slack_webhook_set": bool(SLACK_WEBHOOK_URL),
            "airia_configured": bool(AIRIA_API_URL and AIRIA_API_KEY)
        }
    }

# Company document upload endpoint
@app.post("/company-docs")
async def upload_company_doc(input: CompanyDocInput):
    return {
        "status": "success",
        "message": f"Document '{input.filename}' received. Processing simulation pending Airia integration.",
        "doc": {
            "filename": input.filename,
            "size": input.file_size,
            "type": input.file_type,
            "received_at": datetime.now().isoformat()
        }
    }

# Product document upload endpoint
@app.post("/product-doc")
async def upload_product_doc(input: ProductDocInput):
    return {
        "status": "success",
        "message": f"Product document '{input.filename}' received for analysis.",
        "doc": {
            "filename": input.filename,
            "size": input.file_size,
            "type": input.file_type,
            "received_at": datetime.now().isoformat()
        }
    }

# Application entry point
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


#venv\Scripts\activate
#uvicorn main:app --reload --port 8000
#npm run dev
