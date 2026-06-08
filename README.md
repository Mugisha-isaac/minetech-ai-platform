# MineTech AI Platform

> Self-hosted AI for smart mining operations — Smart Intake Triage + Grounded Knowledge Assistant

**Stack:** Spring Boot 3 · Next.js 14 · PostgreSQL + pgvector · Ollama (Qwen2.5:1.5b) · Docker Compose

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Docker Network                    │
│                                                      │
│  ┌─────────┐    ┌──────────┐    ┌─────────────────┐ │
│  │  Nginx  │───▶│ Next.js  │    │  Spring Boot    │ │
│  │  :80    │    │  :3000   │    │    :8080        │ │
│  └────┬────┘    └──────────┘    └────────┬────────┘ │
│       │                                  │          │
│       └──────────── /api/* ─────────────▶│          │
│                                          │          │
│                             ┌────────────┴──────┐   │
│                             │  PostgreSQL+pgvec │   │
│                             │     :5432         │   │
│                             └───────────────────┘   │
│                                          │          │
│                             ┌────────────┴──────┐   │
│                             │  Ollama           │   │
│                             │  qwen2.5:1.5b     │   │
│                             │  nomic-embed-text │   │
│                             │     :11434        │   │
│                             └───────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin)
- At least **8 GB RAM** available to Docker
- No other services running on ports 80, 3000, 5432, 8080, 11434

---

## Quick Start (3 commands)

```bash
# 1. Clone the repo
git clone https://github.com/Mugisha-isaac/minetech-ai-platform
cd minetech-ai-platform

# 2. Start all services
docker compose up -d

# 3. Wait ~3 minutes for Ollama to pull the models (first run only)
docker compose logs -f ollama-init
# You'll see: "Models ready." when done
```

Then open **http://localhost** in your browser.

---

## Services

| Service         | URL                        | Purpose                          |
|----------------|----------------------------|----------------------------------|
| Web app (Nginx) | http://localhost           | Main entry point                 |
| Frontend        | http://localhost:3000      | Next.js UI (direct)              |
| Backend API     | http://localhost:8080/api  | Spring Boot REST API             |
| Ollama          | http://localhost:11434     | Self-hosted LLM server           |
| PostgreSQL      | localhost:5432             | Postgres + pgvector              |

---

## API Reference

### Triage Endpoints

```
POST /api/triage
Body: { "text": "Conveyor belt in Zone 3 stopped..." }
→ Returns structured JSON ticket

GET  /api/triage?category=Equipment+Failure&priority=HIGH
→ Returns filtered list of tickets

GET  /api/triage/categories
→ Returns distinct categories
```

### Chat / RAG Endpoints

```
POST /api/chat
Body: { "message": "What PPE is required?", "sessionId": null }
→ Returns answer with citations

GET  /api/chat/sessions/{sessionId}
→ Returns chat history

POST /api/chat/kb
Body: { "title": "Policy v3", "content": "..." }
→ Embeds document into pgvector

GET  /api/chat/kb
→ Lists all knowledge base documents
```

---

## Stopping and restarting

```bash
# Stop all services
docker compose down

# Stop and wipe all data (clean slate)
docker compose down -v

# Restart a single service
docker compose restart backend

# View logs
docker compose logs -f backend
docker compose logs -f ollama
```

## Environment Variables

All configuration is in `docker-compose.yml`. Key variables:

| Variable              | Default              | Description              |
|-----------------------|----------------------|--------------------------|
| `OLLAMA_MODEL`        | `qwen2.5:1.5b`       | Chat model               |
| `OLLAMA_EMBEDDING_MODEL` | `nomic-embed-text` | Embedding model        |
| `POSTGRES_PASSWORD`   | `minetech_secret`    | DB password              |
