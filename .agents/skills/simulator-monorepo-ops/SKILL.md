---
name: simulator-monorepo-ops
description: Standard Operating Procedure (SOP) for managing and maintaining the Monorepo architecture (Fastify API backend, Next.js frontend, CLI scripts, and multi-cloud deployment). Use when adding scripts, debugging server ports, running tests, or updating deployment configs.
---

# Monorepo Operations & Architecture SOP

This skill defines the workspace organization, process management, and port allocation across the repository.

---

## 1. Directory Responsibility Matrix

```text
snap-checkout-simulator/
├── backend/          -> Fastify REST API, CLI Runner, Services, Templates, Helpers, Config, db.json
├── frontend/         -> Next.js 15+ App Router, UI Components, BFF Proxy Routes
├── scripts/          -> Bash Shortcuts (*.sh) for CLI simulations
├── docs/             -> Architecture, API Reference, Roadmap, Backlog
├── .agents/skills/   -> Project-specific AI Skills
└── package.json      -> Root workspace orchestrator
```

### Strict Isolation Rules:
- **No dependencies in root**: Root `package.json` only orchestrates child scripts. Never run `npm install <package>` directly in root.
- **Backend dependencies** go into `backend/package.json`.
- **Frontend dependencies** go into `frontend/package.json`.
- **All Bash Shortcuts** live inside `scripts/` and must resolve `BACKEND_DIR="$(dirname "$SCRIPT_PATH")/../backend"`.

---

## 2. Port Allocation & Dev Server Workflows

| Service | Port | Directory | Command |
|---|---|---|---|
| **Fastify REST API** | `3001` | `backend/` | `npm run api` (or `npm start`) |
| **Next.js Web UI** | `3000` | `frontend/` | `npm run dev:frontend` (or `npm run dev`) |
| **Full Stack Concurrent** | `3000` & `3001` | Root | `npm run dev:all` |

---

## 3. Backend For Frontend (BFF) Architecture

The Next.js frontend **NEVER** interacts directly with Winpay RSA keys or database files.
All browser requests flow through Next.js Route Handlers:
```text
Browser UI -> Next.js BFF Route (/app/api/*) -> Fastify API (http://localhost:3001/api/*) -> Winpay PG
```
- Frontend `.env.local` sets `API_URL=http://localhost:3001`.
- Fastify server enables CORS for `http://localhost:3000`.

---

## 4. Multi-Cloud Deployment & Secret Protection Guide
 
 - **Backend (Fly.io)**:
   - Configuration: `fly.toml`
   - Dockerfile: `backend/Dockerfile`
   - Deploy command: `fly deploy`
   - **Secret Protection**:
     - Never run `fly secrets import` to prevent local `.env` leaks.
     - Use `.dockerignore` and `backend/.dockerignore` to filter `.env*` and `*.pem`.
     - Secrets are masked on Fly.io; active credentials are provided dynamically from Frontend UI.
 
 - **Frontend (Vercel)**:
   - Configuration: `vercel.json` (Root Directory: `frontend`)
   - Set Environment Variables in Vercel Dashboard:
     - `API_URL=https://<your-fly-api-app>.fly.dev`
     - `NEXT_PUBLIC_DEFAULT_ENV=development`
