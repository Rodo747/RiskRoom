# ⬡ RISKROOM
## Strategic Decisions. Quantified.
### *Decide before the market decides for you.*

> Internal corporate tool for probabilistic strategic simulation before launching a product into international markets. Combines Monte Carlo simulation, multi-agent AI orchestration via Airia, and real-time market data to quantify risk before it's too late.

**Hackathon:** Airia AI Agents Challenge 2026 — Track 2: Active Agents
**Demo Scenario:** FitPulse Pro Smartwatch — San Francisco Bay Area, California, USA

---

## 🎯 The Problem

Companies launch products into international markets without structurally simulating:

- Competitive reaction
- Regulatory risk
- Demand variability
- Price elasticity
- Financial impact under uncertainty

Decisions are based on linear projections and static analysis. **When the market reacts, it's already too late.**

---

## 💡 The Solution

RiskRoom is a multi-agent system that runs probabilistic simulations before the company makes a real decision.

**It doesn't predict the future. It simulates multiple possible futures.**

- Runs **500 Monte Carlo simulations** per scenario
- Orchestrates **9 specialized AI agents** via Airia
- Performs **real-time web search** for market, competitor, and regulatory data
- Optimizes strategy before execution
- Delivers a **Human-in-the-Loop decision point** where executives approve or reject

---

## 🏗 Architecture

```
React Dashboard (Vercel)
        ↓
FastAPI Backend (Railway)
        ↓
Airia Agent Pipeline
        ↓
┌─────────────────────────────────────────────┐
│  1. Product Document Analyzer  (Haiku 4.5)  │
│  2. Internal Data Agent        (Haiku 4.5)  │
│  3. Orchestrator               (Sonnet 4.6) │
│  4. External Intelligence      (Sonnet 4.6) │ ← Brave MCP web search
│  5. Pricing Optimizer          (Haiku 4.5)  │ ← Brave MCP web search
│  6. Risk Analyst               (Sonnet 4.6) │ ← Calls Monte Carlo API
│  7. Mitigation Strategist      (Haiku 4.5)  │
└─────────────────────────────────────────────┘
        ↓
Monte Carlo Engine (500 iterations, NumPy)
        ↓
Results → Dashboard → HITL Decision
        ↓
APPROVE → PDF Report + Slack + Email
REJECT  → Rejection Report + Slack + Email
```

---

## 🤖 The 9 Airia Agents

| # | Agent | Model | Role |
|---|-------|-------|------|
| 1 | **Product Document Analyzer** | Haiku 4.5 | Reads uploaded product PDFs and extracts key data: name, features, target market, business objective |
| 2 | **Internal Data Agent** | Haiku 4.5 | Reads company data from the database: costs, revenue, margins, historical sales, budgets |
| 3 | **Orchestrator** | Sonnet 4.6 | Central coordinator. Receives all inputs and distributes tasks across all agents |
| 4 | **External Intelligence** | Sonnet 4.6 | Web search via Brave MCP: market size, growth trends, competitive landscape, regulations |
| 5 | **Pricing Optimizer** | Haiku 4.5 | Web search: real-time competitor pricing, elasticity analysis, optimal price range |
| 6 | **Risk Analyst** | Sonnet 4.6 | Interprets Monte Carlo results + all agent outputs. Classifies risk level. Issues Go/No-Go |
| 7 | **Mitigation Strategist** | Haiku 4.5 | Designs top 3 risk mitigation actions with cost and ROI. 90-day contingency plan |



Data Ingestion Agent
Orchestrator Agent
Market Intelligence Agent
Competitor Adversary Agent
Regulatory Risk Agent
Pricing Optimizer
Risk Analyst
Mitigation Strategist Agent
Multi-channel Output Agent
---

## 📱 App Structure — 6 Screens

| Screen | Description |
|--------|-------------|
| **Login / Register** | Authentication with demo credentials for judges |
| **Product Analysis** | Upload product PDF + text description + configure sliders → RUN SIMULATION |
| **Results Dashboard** | Full visual dashboard: world map, Monte Carlo chart, 3 radial gauges, line projection, market share bars, heatmap, HITL decision |
| **Reports** | Current report + full history of past analyses with approve/reject status |
| **Company Setup** | Upload company documents (PDF, Excel, CSV) for AI extraction |
| **Info** | Project overview, agents, tech stack, hackathon details |

---

## ⚙️ Setup — Backend (Python)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Available endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/` | Health check |
| `POST` | `/simulate` | 500 Monte Carlo simulations, returns full distribution |
| `POST` | `/analyze` | Simulation + risk classification + heatmap (25 cells) |
| `POST` | `/optimize` | Generates 5 strategic variants, selects dominant strategy |

**Example request:**
```json
POST /analyze
{
  "precio": 299,
  "costo_unitario": 89,
  "costo_logistico": 22,
  "presupuesto_marketing": 650000,
  "elasticidad": 1.6,
  "agresividad_competitiva": 0.65,
  "riesgo_regulatorio": 0.35,
  "tamano_mercado_estimado": 420000,
  "shock_macro": false,
  "competitor_price_war": false,
  "iteraciones": 500
}
```

---

## 🎨 Setup — Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Open: `http://localhost:5173`

**Demo credentials:**
```
Email:    demo@riskroom.ai
Password: demo1234
```

---

## 📊 Metrics Calculated by the Engine

| Metric | Description |
|--------|-------------|
| Expected ROI | Average across 500 simulations |
| Probability of Success | % of simulations with ROI > 0 |
| Worst Case (P5) | 5th percentile of ROI distribution |
| Best Case (P95) | 95th percentile of ROI distribution |
| Value at Risk | Maximum expected loss at P5 (USD) |
| Strategic Heatmap | ROI under 25 combinations of competitive × regulatory risk |
| 12-Month Projection | Optimistic / Base / Pessimistic scenario curves |

---

## 🎬 Demo Flow (4-minute video)

| Time | Step |
|------|------|
| 0:00–0:30 | Intro: problem RiskRoom solves |
| 0:30–1:00 | Login with demo credentials |
| 1:00–1:45 | Configure FitPulse Pro scenario, activate Price War toggle |
| 1:45–2:30 | RUN SIMULATION → see Monte Carlo chart, gauges, world map, Airia analysis |
| 2:30–3:10 | OPTIMIZE STRATEGY → Strategy Comparison Table |
| 3:10–3:40 | HITL: APPROVE EXECUTION → PDF + Slack + Email triggered |
| 3:40–4:00 | Close: differentiators and enterprise potential |

---

## 🏆 Track 2: Active Agents — Requirements Coverage

| Requirement | Implementation | Status |
|-------------|---------------|--------|
| Multi-system integrations | React + FastAPI + Airia + Brave MCP + Slack + Email | ✅ |
| Human-in-the-Loop (HITL) | Executive Approve/Reject decision point in dashboard | ✅ |
| Dynamic document generation | PDF report on approve AND reject via ReportLab | ✅ |
| Nested agent architectures | 7 specialized agents in Airia pipeline with parallel execution | ✅ |
| Automated cross-platform workflows | Auto-trigger PDF + Slack + Email on decision | ✅ |

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Recharts + Share Tech Mono |
| Backend | Python 3.11 + FastAPI |
| Simulation Engine | NumPy + SciPy (Monte Carlo) |
| AI Orchestration | Airia Agents (7 nodes, parallel execution) |
| LLM | Claude Sonnet 4.6 + Claude Haiku 4.5 |
| Web Search | Brave MCP (real-time market data) |
| Database | PostgreSQL (Railway) |
| Deploy Backend | Railway |
| Deploy Frontend | Vercel |
| Notifications | Slack Webhook + SendGrid Email |
| PDF Generation | ReportLab (Python) |

---

## 🗂 Project Structure

```
riskroom/
├── backend/
│   ├── main.py              ← FastAPI + Monte Carlo engine
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx           ← Router + sidebar navigation
    │   ├── theme.js          ← Design system (colors, fonts)
    │   ├── components.jsx    ← Shared UI components
    │   ├── LoginPage.jsx     ← Authentication
    │   ├── AnalysisPage.jsx  ← Product config + simulation launch
    │   ├── ResultsPage.jsx   ← Full visual dashboard + HITL
    │   ├── ReportsPage.jsx   ← Report history
    │   ├── CompanyPage.jsx   ← Company document upload
    │   └── InfoPage.jsx      ← Project info
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

*RiskRoom does not replace human decision-making.*
*It strengthens executive decisions with quantified strategic simulation before assuming real market risk.*
*It is an internal strategic laboratory for companies that want to reduce uncertainty in international launches.*