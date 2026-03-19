# ⬡ RISKROOM
## Strategic Decisions. Quantified.
### *Simulate the future. Decide with certainty.*

> RiskRoom is an advanced multi-agent AI system that enables companies to simulate, analyze, and validate strategic decisions **before launching products into uncertain markets**.  
> It combines probabilistic modeling (Monte Carlo), real-time market intelligence, and coordinated AI agents to transform uncertainty into actionable insight.

---

## 🎯 The Problem

Launching a product into a new market is one of the riskiest decisions a company can make.

Yet most companies still rely on:
- Static spreadsheets
- Linear forecasts
- Incomplete market research
- Gut-driven executive decisions

They **don’t simulate reality**.

They fail to anticipate:
- Competitor reactions
- Regulatory barriers
- Demand volatility
- Pricing sensitivity
- Financial downside scenarios

**By the time the market responds — it’s already too late.**

---

## 💡 The Solution

RiskRoom creates a **strategic simulation environment** powered by AI agents.

Instead of predicting a single outcome, it explores **hundreds of possible futures**.

- Runs **500 Monte Carlo simulations**
- Uses **9 specialized AI agents** orchestrated via Airia
- Integrates **real-time web intelligence**
- Combines **internal company data + product data**
- Produces a **Go / No-Go decision backed by data**
- Includes a **Human-in-the-Loop (HITL)** for executive validation

> It’s not a dashboard.  
> It’s a **decision engine for high-stakes strategy**.

---

## 🚀 Mission

Empower companies to **reduce uncertainty** and **make high-impact decisions with confidence** by simulating real-world complexity before execution.

---

## 🧠 Core Concept

RiskRoom acts as a **digital war room** where:
- AI agents gather intelligence
- Simulations model uncertainty
- Risks are quantified
- Strategies are optimized
- Humans make the final call

---

## 🏗 Architecture

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


## 🤖 The 9 AI Agents

| # | Agent | Model | Role |
|---|------|------|------|
| 1 | **Data Ingestion Agent** | Haiku 4.5 | Combines product data + company summary into structured input |
| 2 | **Product Document Analyzer** | Haiku 4.5 | Extracts key product info from PDF (features, target, value prop) |
| 3 | **Internal Data Agent** | Haiku 4.5 | Retrieves company metrics (costs, revenue, historical performance) |
| 4 | **Orchestrator** | Sonnet 4.6 | Coordinates all agents and manages execution flow |
| 5 | **Market Intelligence Agent** | Haiku 4.5 | Retrieves market size, growth, trends, and demand signals |
| 6 | **Competitor Adversary Agent** | Haiku 4.5 | Simulates competitor reactions and identifies threats |
| 7 | **Regulatory Risk Agent** | Haiku 4.5 | Identifies legal barriers, compliance cost, and approval timelines |
| 8 | **Pricing Optimizer Agent** | Haiku 4.5 | Recommends optimal pricing based on market + competition |
| 9 | **Risk Analyst Agent** | Sonnet 4.6 | Combines ALL inputs + Monte Carlo → outputs Go/No-Go |
|10 | **Mitigation Strategist Agent** | Haiku 4.5 | Designs risk mitigation strategy and execution plan |

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