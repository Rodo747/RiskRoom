import os
import io
import json
import time
import hashlib
from datetime import datetime
from typing import Optional

import numpy as np
from scipy import stats
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx

# Load environment variables
load_dotenv()

# ─── Configuration ────────────────────────────────────────────────────────────

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
AIRIA_API_URL = os.getenv("AIRIA_API_URL", "")
AIRIA_API_KEY = os.getenv("AIRIA_API_KEY", "")

app = FastAPI(title="RiskRoom Monte Carlo Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, use FRONTEND_URL
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Input Models ───────────────────────────────────────────────────────────

class SimulationInput(BaseModel):
    precio: float = 299.0
    costo_unitario: float = 120.0
    costo_logistico: float = 25.0
    presupuesto_marketing: float = 500000.0
    elasticidad: float = 1.4
    agresividad_competitiva: float = 0.5
    riesgo_regulatorio: float = 0.3
    tamano_mercado_estimado: int = 500000
    shock_macro: bool = False
    competitor_price_war: bool = False
    iteraciones: int = 500
    product_description: Optional[str] = None

class InsightInput(BaseModel):
    metricas: dict
    nivel_riesgo: str
    product_description: Optional[str] = None

class ProductDocInput(BaseModel):
    filename: str
    file_size: int
    file_type: str
    product_description: Optional[str] = None

class SlackNotifyInput(BaseModel):
    decision: str  # "approved" or "rejected"
    roi_esperado: float
    prob_exito: float
    nivel_riesgo: str
    product_name: Optional[str] = "Product Launch"

class PDFGenerateInput(BaseModel):
    metricas: dict
    analisis: dict
    decision: str
    product_name: Optional[str] = "Product Launch"
    insight: Optional[str] = None

class CompanyDocInput(BaseModel):
    filename: str
    file_size: int
    file_type: str
    company_id: Optional[str] = None

# ─── Core Monte Carlo Logic ──────────────────────────────────────────────────

def run_monte_carlo(params: SimulationInput) -> dict:
    # Use os.urandom for true random seed (not predictable)
    np.random.seed(int.from_bytes(os.urandom(4), 'big'))
    n = params.iteraciones

    precio = params.precio
    costo_unit = params.costo_unitario
    costo_log = params.costo_logistico
    presupuesto_mkt = params.presupuesto_marketing
    elasticidad = params.elasticidad
    agresividad = params.agresividad_competitiva
    riesgo_reg = params.riesgo_regulatorio
    tam_mercado = params.tamano_mercado_estimado

    # Apply shock modifiers
    if params.shock_macro:
        elasticidad *= 1.35
        agresividad = min(agresividad * 1.2, 1.0)

    if params.competitor_price_war:
        agresividad = min(agresividad * 1.8, 1.0)
        elasticidad *= 1.5

    # Stochastic variables
    precio_efectivo = np.random.normal(precio, precio * 0.05, n)
    elasticidad_real = np.random.normal(elasticidad, 0.2, n)
    penetracion_base = 0.04 + (presupuesto_mkt / 10_000_000) * 0.06
    penetracion = np.random.beta(2, 20, n) * penetracion_base * 25

    # Competitive erosion
    erosion_competitiva = np.random.normal(agresividad * 0.3, 0.05, n)
    penetracion_ajustada = penetracion * (1 - erosion_competitiva)
    penetracion_ajustada = np.clip(penetracion_ajustada, 0.001, 0.25)

    # Regulatory impact (random binary events)
    evento_regulatorio = np.random.random(n) < riesgo_reg
    factor_regulatorio = np.where(evento_regulatorio,
                                   np.random.uniform(0.4, 0.75, n), 1.0)

    # Units sold
    unidades_vendidas = (tam_mercado * penetracion_ajustada * factor_regulatorio).astype(int)
    unidades_vendidas = np.maximum(unidades_vendidas, 0)

    # Financials
    margen_unit = precio_efectivo - costo_unit - costo_log
    ingresos = precio_efectivo * unidades_vendidas
    costos_totales = (costo_unit + costo_log) * unidades_vendidas + presupuesto_mkt
    utilidad = ingresos - costos_totales
    roi = (utilidad / costos_totales) * 100

    # Risk metrics
    prob_exito = float(np.mean(roi > 0) * 100)
    roi_esperado = float(np.mean(roi))
    roi_mediana = float(np.median(roi))
    worst_case = float(np.percentile(roi, 5))
    best_case = float(np.percentile(roi, 95))
    var_5 = float(np.percentile(utilidad, 5))
    std_roi = float(np.std(roi))

    # Distribution histogram
    hist, bin_edges = np.histogram(roi, bins=40)
    distribution = [
        {"roi": float(round((bin_edges[i] + bin_edges[i+1]) / 2, 1)),
         "frecuencia": int(hist[i]),
         "probabilidad": float(round(hist[i] / n * 100, 2))}
        for i in range(len(hist))
    ]

    # Scenario breakdown
    escenarios = {
        "optimista": {"prob": float(np.mean(roi > 30) * 100), "roi_promedio": float(np.mean(roi[roi > 30])) if np.any(roi > 30) else 0},
        "neutral": {"prob": float(np.mean((roi >= 0) & (roi <= 30)) * 100), "roi_promedio": float(np.mean(roi[(roi >= 0) & (roi <= 30)])) if np.any((roi >= 0) & (roi <= 30)) else 0},
        "pesimista": {"prob": float(np.mean(roi < 0) * 100), "roi_promedio": float(np.mean(roi[roi < 0])) if np.any(roi < 0) else 0},
    }

    return {
        "metricas": {
            "prob_exito": round(prob_exito, 1),
            "roi_esperado": round(roi_esperado, 1),
            "roi_mediana": round(roi_mediana, 1),
            "worst_case_roi": round(worst_case, 1),
            "best_case_roi": round(best_case, 1),
            "value_at_risk": round(var_5 / 1_000_000, 2),
            "std_roi": round(std_roi, 1),
            "unidades_promedio": int(np.mean(unidades_vendidas)),
            "ingresos_esperados": round(float(np.mean(ingresos)) / 1_000_000, 2),
            "utilidad_esperada": round(float(np.mean(utilidad)) / 1_000_000, 2),
        },
        "distribucion": distribution,
        "escenarios": escenarios,
        "iteraciones": n,
        "params_usados": params.dict(),
    }

# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "RiskRoom Monte Carlo Engine running", "version": "1.0.0"}

@app.post("/simulate")
def simulate(params: SimulationInput):
    """Run 500 Monte Carlo simulations and return raw distribution."""
    results = run_monte_carlo(params)
    return {"status": "success", "data": results}

@app.post("/analyze")
def analyze(params: SimulationInput):
    """Analyze simulation results and classify risk level."""
    results = run_monte_carlo(params)
    metricas = results["metricas"]

    # Risk classification
    roi_e = metricas["roi_esperado"]
    prob = metricas["prob_exito"]
    var = metricas["value_at_risk"]

    if prob >= 70 and roi_e >= 25:
        nivel_riesgo = "BAJO"
        color_riesgo = "green"
        recomendacion = "Estrategia viable. Proceder con lanzamiento controlado."
    elif prob >= 50 and roi_e >= 10:
        nivel_riesgo = "MEDIO"
        color_riesgo = "yellow"
        recomendacion = "Estrategia aceptable. Revisar pricing y mitigar riesgo regulatorio."
    elif prob >= 35:
        nivel_riesgo = "ALTO"
        color_riesgo = "orange"
        recomendacion = "Estrategia riesgosa. Optimizar supuestos antes de ejecutar."
    else:
        nivel_riesgo = "CRITICO"
        color_riesgo = "red"
        recomendacion = "No ejecutar con supuestos actuales. Requiere reestructuracion."

    # Heatmap risk matrix (competitive vs regulatory)
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

    return {
        "status": "success",
        "data": {
            **results,
            "analisis": {
                "nivel_riesgo": nivel_riesgo,
                "color_riesgo": color_riesgo,
                "recomendacion": recomendacion,
            },
            "heatmap": heatmap,
        }
    }

@app.post("/optimize")
def optimize(params: SimulationInput):
    """Generate 5 strategic variants and select the dominant one."""
    base = run_monte_carlo(params)

    variantes = []

    configs = [
        {
            "nombre": "Estrategia Original",
            "descripcion": "Parametros base sin modificar",
            "params_delta": {},
            "tag": "base"
        },
        {
            "nombre": "Precio Premium",
            "descripcion": "Aumentar precio 15%, reducir elasticidad risk via menor volumen",
            "params_delta": {"precio": params.precio * 1.15, "presupuesto_marketing": params.presupuesto_marketing * 1.2},
            "tag": "premium"
        },
        {
            "nombre": "Penetracion Agresiva",
            "descripcion": "Reducir precio 10%, aumentar marketing 40%",
            "params_delta": {"precio": params.precio * 0.90, "presupuesto_marketing": params.presupuesto_marketing * 1.4},
            "tag": "penetracion"
        },
        {
            "nombre": "Eficiencia de Costos",
            "descripcion": "Optimizar logistica, reducir costo unitario 8%",
            "params_delta": {"costo_unitario": params.costo_unitario * 0.92, "costo_logistico": params.costo_logistico * 0.85},
            "tag": "eficiencia"
        },
        {
            "nombre": "Mitigacion de Riesgo",
            "descripcion": "Inversion en compliance, reducir riesgo regulatorio 50%",
            "params_delta": {"riesgo_regulatorio": params.riesgo_regulatorio * 0.5, "presupuesto_marketing": params.presupuesto_marketing * 0.9},
            "tag": "mitigacion"
        },
    ]

    for cfg in configs:
        p_dict = params.dict()
        p_dict.update(cfg["params_delta"])
        p = SimulationInput(**p_dict)
        result = run_monte_carlo(p)
        m = result["metricas"]

        score = (m["prob_exito"] * 0.4) + (m["roi_esperado"] * 0.35) + (m["worst_case_roi"] * 0.25)

        variantes.append({
            "nombre": cfg["nombre"],
            "descripcion": cfg["descripcion"],
            "tag": cfg["tag"],
            "metricas": m,
            "score": round(score, 2),
            "params": p_dict,
        })

    variantes_sorted = sorted(variantes, key=lambda x: x["score"], reverse=True)
    dominante = variantes_sorted[0]
    original = next(v for v in variantes if v["tag"] == "base")

    reduccion_riesgo = original["metricas"]["prob_exito"] - (100 - dominante["metricas"]["prob_exito"])
    mejora_roi = dominante["metricas"]["roi_esperado"] - original["metricas"]["roi_esperado"]

    return {
        "status": "success",
        "data": {
            "variantes": variantes,
            "estrategia_dominante": dominante,
            "estrategia_original": original,
            "comparacion": {
                "mejora_roi": round(mejora_roi, 1),
                "mejora_prob_exito": round(dominante["metricas"]["prob_exito"] - original["metricas"]["prob_exito"], 1),
                "reduccion_riesgo": round(original["metricas"]["prob_exito"] - dominante["metricas"]["prob_exito"] if dominante["metricas"]["prob_exito"] > original["metricas"]["prob_exito"] else 0, 1),
                "mensaje_hitl": f"Estrategia '{dominante['nombre']}' mejora ROI en {round(mejora_roi, 1)}% y eleva probabilidad de exito a {dominante['metricas']['prob_exito']}%."
            }
        }
    }

# ─── AI Insight Endpoint ─────────────────────────────────────────────────────

@app.post("/insight")
async def get_insight(input: InsightInput):
    """Generate AI insight using Claude API (called from backend, not frontend)."""

    if not ANTHROPIC_API_KEY:
        # Fallback insight if no API key
        return {
            "status": "success",
            "insight": f"Analisis automatizado: ROI esperado {input.metricas.get('roi_esperado', 'N/A')}%, probabilidad de exito {input.metricas.get('prob_exito', 'N/A')}%. Nivel de riesgo: {input.nivel_riesgo}. Se recomienda revisar los factores de riesgo antes de proceder."
        }

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

# ─── Slack Notification Endpoint ─────────────────────────────────────────────

@app.post("/notify-slack")
async def notify_slack(input: SlackNotifyInput):
    """Send notification to Slack via webhook."""

    if not SLACK_WEBHOOK_URL:
        return {"status": "success", "message": "Slack webhook not configured (skipped)"}

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

# ─── PDF Generation Endpoint ────────────────────────────────────────────────

@app.post("/generate-pdf")
async def generate_pdf(input: PDFGenerateInput):
    """Generate PDF report using ReportLab."""

    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)

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

    # Title
    decision_title = "EXECUTIVE APPROVAL REPORT" if input.decision == "approved" else "REJECTION ANALYSIS REPORT"
    elements.append(Paragraph(f"RiskRoom: {decision_title}", title_style))
    elements.append(Paragraph(f"Product: {input.product_name}", body_style))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", body_style))
    elements.append(Spacer(1, 0.3*inch))

    # Risk Level
    risk_color = colors.HexColor('#00cc66') if input.analisis.get('nivel_riesgo') == 'BAJO' else \
                 colors.HexColor('#dd8800') if input.analisis.get('nivel_riesgo') == 'MEDIO' else \
                 colors.HexColor('#ff4422')

    elements.append(Paragraph("RISK CLASSIFICATION", heading_style))
    elements.append(Paragraph(f"Level: {input.analisis.get('nivel_riesgo', 'N/A')}", body_style))
    elements.append(Paragraph(f"Recommendation: {input.analisis.get('recomendacion', 'N/A')}", body_style))
    elements.append(Spacer(1, 0.2*inch))

    # Metrics Table
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

    # AI Insight
    if input.insight:
        elements.append(Paragraph("AI ANALYSIS", heading_style))
        elements.append(Paragraph(input.insight, body_style))
        elements.append(Spacer(1, 0.2*inch))

    # Decision
    elements.append(Paragraph("EXECUTIVE DECISION", heading_style))
    decision_text = "APPROVED - Roadmap activated, notifications sent." if input.decision == "approved" else "REJECTED - Launch cancelled, report generated."
    elements.append(Paragraph(decision_text, body_style))
    elements.append(Spacer(1, 0.2*inch))

    # Footer
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

    doc.build(elements)
    buffer.seek(0)

    filename = f"riskroom_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ─── Airia Proxy Endpoint (for future Airia integration) ─────────────────────

@app.post("/airia/run")
async def run_airia_pipeline(params: SimulationInput):
    """Proxy endpoint to call Airia pipeline when deployed."""

    if not AIRIA_API_URL or not AIRIA_API_KEY:
        return {
            "status": "error",
            "message": "Airia not configured. Running local Monte Carlo only.",
            "data": run_monte_carlo(params)
        }

    try:
        async with httpx.AsyncClient() as client:
            # This will be configured when Airia is deployed
            response = await client.post(
                f"{AIRIA_API_URL}/v1/pipelines/run",
                headers={
                    "Authorization": f"Bearer {AIRIA_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "pipeline_id": "riskroom_analysis",
                    "input": params.dict()
                },
                timeout=60.0
            )

            if response.status_code == 200:
                return {"status": "success", "data": response.json()}
            else:
                # Fallback to local simulation
                return {
                    "status": "partial",
                    "message": f"Airia error {response.status_code}, using local fallback",
                    "data": run_monte_carlo(params)
                }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "data": run_monte_carlo(params)
        }

# ─── Health Check ───────────────────────────────────────────────────────────

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

@app.post("/company-docs")
async def upload_company_doc(input: CompanyDocInput):
    """Receive company document metadata. In production, this would process the actual file."""
    # For now, just acknowledge receipt - file processing would happen here
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

@app.post("/product-doc")
async def upload_product_doc(input: ProductDocInput):
    """Receive product document metadata for simulation."""
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)