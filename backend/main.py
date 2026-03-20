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

AIRIA_API_KEY      = os.getenv("AIRIA_API_KEY",      "YOUR_AIRIA_API_KEY_HERE")
PIPELINE_1_ID      = os.getenv("AIRIA_PIPELINE_ID",  "b6df3b96-6255-4b98-adaf-c1bfe11fdf6e")  # Analysis
PIPELINE_2_ID      = os.getenv("AIRIA_PIPELINE_2_ID","YOUR_PIPELINE_2_ID_HERE")                # Report
HEADERS            = {"X-API-KEY": AIRIA_API_KEY, "Content-Type": "application/json"}
URL_P1             = f"https://api.airia.ai/v2/PipelineExecution/{PIPELINE_1_ID}"
URL_P2             = f"https://api.airia.ai/v2/PipelineExecution/{PIPELINE_2_ID}"

JOBS: dict = {}

app = FastAPI(title="RiskRoom", version="8.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

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
        async with httpx.AsyncClient(timeout=1200.0) as client:
            resp = await client.post(URL_P1,
                json={"userInput": user_input, "asyncOutput": False},
                headers=HEADERS)
        print(f"[{job_id}] P1 HTTP {resp.status_code} | {repr(resp.text[:300])}")

        if resp.status_code != 200:
            JOBS[job_id] = {"status":"error","detail":f"P1 HTTP {resp.status_code}: {resp.text[:200]}"}
            return

        try:
            d = resp.json()
        except Exception:
            _save(job_id, resp.text, mc)
            return

        # Handle $type wrapper
        if isinstance(d, dict) and d.get("$type") == "string":
            raw = d.get("result", "")
        else:
            raw = d.get("output") or d.get("result") or d.get("response") or json.dumps(d)

        # Check if raw is just a UUID/executionId (Airia async response leak)
        # If so, it means asyncOutput:False still returned async — use full response
        import re
        is_uuid = isinstance(raw, str) and bool(re.match(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            raw.strip()
        ))
        if is_uuid:
            print(f"[{job_id}] Got UUID instead of JSON — Airia returned executionId. Full response: {repr(resp.text[:500])}")
            # Try to get analysis from the full response object
            raw = json.dumps(d) if isinstance(d, dict) else resp.text

        _save(job_id, raw if isinstance(raw,str) else json.dumps(raw), mc)

    except Exception as ex:
        print(f"[{job_id}] P1 ERROR: {ex}")
        import traceback; traceback.print_exc()
        JOBS[job_id] = {"status":"error","detail":str(ex)}

# ── Pipeline 2: Report generation ────────────────────────────────────────────
async def _run_report(job_id: str, decision: str):
    """Call Pipeline 2 to generate report text after human decision."""
    if PIPELINE_2_ID == "YOUR_PIPELINE_2_ID_HERE":
        print(f"[{job_id}] Pipeline 2 not configured — skipping report generation")
        JOBS[job_id]["status"] = "done"
        JOBS[job_id]["report_text"] = ""
        return

    job  = JOBS.get(job_id, {})
    summary = job.get("executive_summary","")
    rec     = job.get("recommendation","")
    risks   = json.dumps(job.get("risk_factors",[]))
    mit     = json.dumps(job.get("mitigation",[]))

    user_input = f"""decision: {decision}
recommendation: {rec}
executive_summary: {summary}
risk_factors: {risks}
mitigation_actions: {mit}
full_analysis: {job.get('full_analysis','')[:500]}"""

    print(f"[{job_id}] Pipeline 2: Generating {decision} report...")
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(URL_P2,
                json={"userInput": user_input, "asyncOutput": False},
                headers=HEADERS)
        print(f"[{job_id}] P2 HTTP {resp.status_code} | {repr(resp.text[:200])}")

        report_text = ""
        if resp.status_code == 200 and resp.text.strip():
            try:
                d = resp.json()
                if isinstance(d, dict) and d.get("$type") == "string":
                    report_text = d.get("result","")
                else:
                    report_text = d.get("output") or d.get("result") or d.get("text") or resp.text
            except Exception:
                report_text = resp.text

        JOBS[job_id]["report_text"] = report_text
        JOBS[job_id]["status"]      = "done"
        JOBS[job_id]["decision"]    = decision
        JOBS[job_id]["decision_time"] = datetime.now().isoformat()
        print(f"[{job_id}] P2 DONE | report_text len={len(report_text)}")

    except Exception as ex:
        print(f"[{job_id}] P2 ERROR: {ex}")
        JOBS[job_id]["status"]      = "done"
        JOBS[job_id]["report_text"] = ""
        JOBS[job_id]["decision"]    = decision

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
def root(): return {"service":"RiskRoom","version":"8.0.0"}

@app.get("/health")
def health(): return {
    "status":"healthy",
    "timestamp":datetime.now().isoformat(),
    "pipeline_1": PIPELINE_1_ID,
    "pipeline_2": PIPELINE_2_ID,
    "airia_configured": AIRIA_API_KEY != "YOUR_AIRIA_API_KEY_HERE",
}

@app.post("/analyze/start")
async def analyze_start(inp: AnalysisInput):
    if not inp.project_info.strip(): raise HTTPException(400,"project_info empty")
    if not inp.company_info.strip():  raise HTTPException(400,"company_info empty")
    mc     = run_monte_carlo(inp)
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {"status":"pending"}
    asyncio.create_task(_run_analysis(job_id, _prompt(inp, mc), mc))
    print(f"[{job_id}] Task created")
    return {"job_id":job_id,"status":"pending","monte_carlo":mc}

@app.get("/analyze/status/{job_id}")
def analyze_status(job_id: str):
    job = JOBS.get(job_id)
    if not job: raise HTTPException(404,"Job not found")
    safe = {k:v for k,v in job.items() if k not in ("pdf_base64",)}
    safe["has_pdf"]     = bool(job.get("pdf_base64"))
    safe["report_text"] = job.get("report_text","")
    return safe

@app.post("/analyze/decide/{job_id}")
async def analyze_decide(job_id: str, body: DecisionInput):
    """Human decision → triggers Pipeline 2 for report text."""
    job = JOBS.get(job_id)
    if not job: raise HTTPException(404,"Job not found")
    decision = body.decision.lower()
    if decision not in ("approved","rejected"): raise HTTPException(400,"invalid")

    JOBS[job_id]["decision"]      = decision
    JOBS[job_id]["decision_time"] = datetime.now().isoformat()
    JOBS[job_id]["status"]        = "generating_report"

    # Fire Pipeline 2 in background
    asyncio.create_task(_run_report(job_id, decision))

    return {"status":"generating_report","decision":decision,"job_id":job_id}

@app.get("/analyze/pdf/{job_id}")
def get_pdf(job_id: str):
    """If Airia sends pdf_base64, serve it. Otherwise frontend uses jsPDF."""
    job = JOBS.get(job_id)
    if not job: raise HTTPException(404,"Not found")
    pdf = job.get("pdf_base64")
    if not pdf: raise HTTPException(404,"No PDF — use jsPDF in frontend")
    return Response(base64.b64decode(pdf), media_type="application/pdf",
        headers={"Content-Disposition":f"attachment; filename=riskroom_report.pdf"})

@app.delete("/analyze/status/{job_id}")
def cleanup(job_id: str):
    JOBS.pop(job_id,None); return {"deleted":job_id}