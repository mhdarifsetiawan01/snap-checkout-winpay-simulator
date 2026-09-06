# Monorepo Structure Refactoring Plan

## Deskripsi & Tujuan
Merapikan struktur project **snap-checkout-simulator** menjadi struktur Monorepo standar yang bersih dan modular:
- **`backend/`**: Seluruh backend Fastify REST API, CLI engine (`simulator.js`), services, templates, helpers, config, dan kredensial.
- **`frontend/`**: Next.js 15+ App Router web dashboard, components, BFF proxy routes, dan styles.
- **`scripts/`**: Semua bash CLI shortcuts (`create-va.sh`, `create-qris.sh`, dsb).
- **`docs/`**: Arsitektur, API Reference, Roadmap, dan Backlog.
- **Root**: Workspace level `package.json` untuk menjalankan dev server (`npm run api`, `npm run dev:frontend`, `npm run dev:all`), `AGENTS.md`, `README.md`, dan konfigurasi deployment (`fly.toml`, `vercel.json`).

---

## Proposed Changes

### 1. Backend Isolation (`backend/`)
Pindahkan modul-modul backend ke direktori `backend/`:
- Pindahkan `api/` ke `backend/api/`
- Pindahkan `config/` ke `backend/config/`
- Pindahkan `helpers/` ke `backend/helpers/`
- Pindahkan `services/` ke `backend/services/`
- Pindahkan `templates/` ke `backend/templates/`
- Pindahkan `simulator.js` ke `backend/simulator.js`
- Pindahkan `server.js` (legacy webhook) ke `backend/server.js`
- Pindahkan `db.json`, `.env`, `sample.env` ke `backend/`
- Pindahkan `Dockerfile.api` ke `backend/Dockerfile`
- Pindahkan backend `package.json` dan `node_modules` ke `backend/`

### 2. Scripts Directory (`scripts/`)
Pindahkan semua shortcut bash ke `scripts/` dan sesuaikan path pemanggilan ke `backend/`:
- `scripts/create-va.sh`
- `scripts/create-qris.sh`
- `scripts/create-ewallet.sh`
- `scripts/create-invoice.sh`
- `scripts/find-invoice.sh`
- `scripts/start-callback.sh`

### 3. Frontend Integration (`frontend/`)
- Pastikan BFF Proxy di `frontend/app/api/*` tetap terarah ke `process.env.API_URL` (default: `http://localhost:3001`).
- Sesuaikan script di `frontend/package.json`.

### 4. Root Orchestration & Deployment
- Buat root `package.json` dengan scripts:
  - `"api"`: `"cd backend && npm start"`
  - `"dev:frontend"`: `"cd frontend && npm run dev"`
  - `"dev:all"`: `"concurrently \"npm run api\" \"npm run dev:frontend\""`
- Update `fly.toml` untuk mengarah ke `backend/Dockerfile`
- Update `vercel.json` untuk mengarah ke `frontend`
- Update `AGENTS.md` dan `README.md` mencerminkan struktur folder baru.

---

## Verification Plan

### Automated / Smoke Tests
1. **CLI Shortcuts**: Jalankan `./scripts/create-va.sh BNC 50000 dev` dan verifikasi response.
2. **Fastify API**: Jalankan `node backend/api/server.js` dan verifikasi `curl http://localhost:3001/api/health` -> HTTP 200.
3. **Next.js Frontend**: Jalankan dev server dan verifikasi `curl http://localhost:3000/` & `/snap` & `/checkout` -> HTTP 200.
4. **Proxy Route Handlers**: Verifikasi `curl http://localhost:3000/api/state` terhubung ke backend.
