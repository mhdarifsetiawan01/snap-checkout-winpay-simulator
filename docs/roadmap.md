# Roadmap — snap-checkout-simulator

Rencana pengembangan project dari CLI tool menjadi full-stack platform testing Winpay API.

---

## 🎯 Visi Akhir

> **"Testing Winpay API semudah mengklik tombol di browser — tanpa perlu buka terminal, tanpa setup manual."**

---

## ✅ Phase 0 — CLI Foundation *(Selesai)*

Project awal sebagai CLI simulator berbasis Node.js.

| Item | Status |
|---|---|
| CLI Runner (`simulator.js`) | ✅ Done |
| Bash Shortcuts (`*.sh`) | ✅ Done |
| SNAP API: Create VA | ✅ Done |
| SNAP API: Inquiry VA | ✅ Done |
| SNAP API: Payment Status VA | ✅ Done |
| SNAP API: Create QRIS | ✅ Done |
| SNAP API: Create eWallet (SPAY, DANA, OVO, SC, ASTRA) | ✅ Done |
| Checkout Page: Create Invoice | ✅ Done |
| Checkout Page: Find Invoice | ✅ Done |
| Webhook Receiver Server (bare Node.js) | ✅ Done |
| RSA-SHA256 Signature (SNAP) | ✅ Done |
| HMAC-SHA256 Signature (Checkout) | ✅ Done |
| Callback Signature Verification | ✅ Done |
| Multi-environment (dev/sandbox/prod) | ✅ Done |
| State storage via lowdb (`db.json`) | ✅ Done |

---

## 🚧 Phase 1 — Dokumentasi & Arsitektur *(In Progress)*

Fondasi dokumentasi sebelum ekspansi kode.

| Item | Status |
|---|---|
| `AGENTS.md` (panduan AI agent) | ✅ Done |
| `docs/architecture.md` | ✅ Done |
| `docs/api-reference.md` | ✅ Done |
| `docs/roadmap.md` | ✅ Done |
| `docs/backlog.md` | ✅ Done |

---

## 🔧 Phase 2 — REST API Layer (Fastify) *(Planned)*

Bungkus semua services dalam Fastify HTTP server agar bisa diakses dari luar CLI.

**Target selesai**: Sesi ini

| Item | Status |
|---|---|
| Install Fastify + `@fastify/cors` | 🔲 Todo |
| `api/server.js` — Entry point Fastify (port 3001) | 🔲 Todo |
| `api/plugins/cors.js` — CORS untuk Next.js | 🔲 Todo |
| `api/routes/snap.js` — VA, QRIS, eWallet endpoints | 🔲 Todo |
| `api/routes/checkoutpage.js` — Invoice endpoints | 🔲 Todo |
| `api/routes/callback.js` — Webhook receiver | 🔲 Todo |
| `api/routes/state.js` — State db.json reader | 🔲 Todo |
| Update `package.json` scripts (`npm run api`) | 🔲 Todo |
| Smoke test semua endpoint via curl/Postman | 🔲 Todo |

---

## 🖥️ Phase 3 — Web Dashboard (Next.js) *(Planned)*

Frontend interaktif sebagai pengganti terminal untuk trigger API.

**Target selesai**: Sesi berikutnya

| Item | Status |
|---|---|
| Init Next.js project di `frontend/` | 🔲 Todo |
| Dashboard layout + navigasi | 🔲 Todo |
| Panel SNAP (form VA, QRIS, eWallet) | 🔲 Todo |
| Panel Checkout Page (form Invoice) | 🔲 Todo |
| JSON Response Viewer (pretty-print) | 🔲 Todo |
| State Panel (monitor db.json: lastVA, lastTrx, dll) | 🔲 Todo |
| Callback/Webhook Log (tampilkan callback masuk) | 🔲 Todo |
| Environment switcher (dev / sandbox / prod) | 🔲 Todo |

---

## 🚀 Phase 4 — Fitur Lanjutan *(Future)*

Ide-ide pengembangan jangka panjang.

| Item | Prioritas |
|---|---|
| Real-time webhook log via WebSocket / SSE | 🔵 Medium |
| History transaksi (bukan hanya "last") | 🔵 Medium |
| Export response ke JSON / clipboard | 🔵 Medium |
| QR Code image renderer di frontend (untuk QRIS) | 🔵 Medium |
| Mock mode — simulasi response tanpa hit real API | 🟡 Low |
| Docker Compose setup (API + Frontend) | 🟡 Low |
| Auth middleware sederhana untuk API (API Key) | 🟡 Low |
| Unit test helpers (signature, timestamp, externalId) | 🟡 Low |
