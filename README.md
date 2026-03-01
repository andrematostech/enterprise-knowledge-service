# KIVO

KIVO is an enterprise-grade knowledge infrastructure platform for deploying secure, multi-tenant Retrieval-Augmented Generation (RAG) systems over private organizational data.

It provides a production-oriented control plane for document ingestion, vector indexing, retrieval diagnostics, usage analytics, and workspace-level isolation.

---

## Why KIVO?

Most RAG demos stop at embeddings and prompt engineering. KIVO focuses on the infrastructure required to operate RAG systems reliably.

KIVO focuses on the missing layer:
- Workspace isolation
- Idempotent ingestion pipelines
- Vector lifecycle management
- Usage and latency analytics
- Operational visibility

It is designed as a backend-first system with a control-plane UI — not a chatbot demo.

---

## Architecture

```
┌──────────────────────────────┐
│        React Admin UI        │
│  (Control Plane Dashboard)   │
└──────────────┬───────────────┘
               │ REST
┌──────────────▼───────────────┐
│        FastAPI Backend       │
│ - Auth / RBAC                │
│ - Ingestion Service          │
│ - Query Service              │
│ - Analytics Service          │
└───────┬───────────┬──────────┘
        │           │
        │           │
┌───────▼──────┐ ┌──▼───────────┐
│ PostgreSQL   │ │ Chroma DB    │
│ Metadata     │ │ Vector Store │
└──────────────┘ └──────────────┘
        │
        ▼
   OpenAI API
```

---

## Supported Document Types

- PDF
- TXT
- Markdown
- DOCX
- CSV
- XLSX
- PPTX
- TEX

> Note: Legacy `.doc` files are not supported.

---

## Key Features

- Multi-tenant workspace isolation
- Deterministic chunking & ingestion idempotency
- Vector store lifecycle management
- Query logging with latency + token metrics
- Usage analytics dashboard
- Role-based access primitives
- Broadcast & messaging system

---

## Project Status

This project is a portfolio-grade reference implementation of an enterprise RAG control plane.
It is not a managed SaaS offering.


## Quickstart (Docker)

### 1. Configure environment

Create an `.env` file in the project root:

```bash
OPENAI_API_KEY=your_openai_key_here
API_KEY=changeme
```

### 2. Run the stack

```bash
docker compose up --build
```

Services typically include:

- `api` – FastAPI backend  
- `db` – PostgreSQL  
- `chroma` – Vector store  
- `web` – React admin UI  

### 3. Access the application

- **UI:** http://localhost:<web-port>  
- **API:** http://localhost:<api-port>  

(Ports depend on your `docker-compose.yml` configuration.)

---

## Control Plane UI

Key areas:

- **Dashboard** – system pulse, query volume, retrieval snapshot, recent queries & ingests  
- **Ask AI** – query and history view (`Query | History`)  
- **Documents** – upload/manage documents and view ingestion runs (`Files | Runs`)  
- **Messages** – direct messages and broadcasts  
- **Usage** – metrics and retrieval diagnostics (`Usage | Retrieval`)  
- **Settings** – connection and workspace management  

## Technology Stack

- Python (FastAPI)
- PostgreSQL
- Chroma
- OpenAI API
- React
- Docker Compose