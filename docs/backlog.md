# Backlog — snap-checkout-simulator

Daftar lengkap fitur yang sudah ada, sedang dikerjakan, dan direncanakan.

---

## 🏷️ Label Status

| Label | Keterangan |
|---|---|
| ✅ `done` | Selesai & berjalan di production |
| 🔄 `in-progress` | Sedang dikerjakan saat ini |
| 🔲 `planned` | Sudah direncanakan, belum dikerjakan |
| 💡 `idea` | Ide mentah, belum dikonfirmasi prioritas |
| ❌ `cancelled` | Dibatalkan |

---

## 🔥 Sprint Aktif — Phase 2: REST API (Fastify)

| ID | Fitur | Status | Keterangan |
|---|---|---|---|
| API-01 | Install Fastify + @fastify/cors | 🔲 planned | `npm install fastify @fastify/cors` |
| API-02 | `api/server.js` — Entry point Fastify | 🔲 planned | Port 3001, load semua routes |
| API-03 | `api/plugins/cors.js` | 🔲 planned | Izinkan akses dari `localhost:3000` |
| API-04 | `api/routes/snap.js` — Create VA | 🔲 planned | Wrapper `services/snap.js → createva()` |
| API-05 | `api/routes/snap.js` — Inquiry VA | 🔲 planned | Wrapper `services/snap.js → inquiryva()` |
| API-06 | `api/routes/snap.js` — Status VA | 🔲 planned | Wrapper `services/snap.js → statusva()` |
| API-07 | `api/routes/snap.js` — Create QRIS | 🔲 planned | Wrapper `services/snap.js → createqris()` |
| API-08 | `api/routes/snap.js` — Create eWallet | 🔲 planned | Wrapper `services/snap.js → createewallet()` |
| API-09 | `api/routes/checkoutpage.js` — Create Invoice | 🔲 planned | Wrapper `services/checkoutpage.js → createinvoice()` |
| API-10 | `api/routes/checkoutpage.js` — Find Invoice | 🔲 planned | Wrapper `services/checkoutpage.js → findinvoice()` |
| API-11 | `api/routes/callback.js` — SNAP webhook | 🔲 planned | Listener POST `/api/callback/snap` |
| API-12 | `api/routes/callback.js` — Checkout webhook | 🔲 planned | Listener POST `/api/callback/checkout` |
| API-13 | `api/routes/state.js` — Read db.json | 🔲 planned | GET `/api/state` |
| API-14 | Update `package.json` scripts | 🔲 planned | `"api": "node api/server.js"` |

---

## 📅 Backlog — Phase 3: Frontend (Next.js)

| ID | Fitur | Status | Keterangan |
|---|---|---|---|
| FE-01 | Init Next.js di `frontend/` | 🔲 planned | `npx create-next-app@latest` |
| FE-02 | Layout utama + navigasi | 🔲 planned | Sidebar: SNAP / Checkout / State |
| FE-03 | Dashboard page (`/`) | 🔲 planned | Overview & quick actions |
| FE-04 | SNAP panel — Form Create VA | 🔲 planned | Input: channel, amount, env |
| FE-05 | SNAP panel — Form Create QRIS | 🔲 planned | Input: amount, env |
| FE-06 | SNAP panel — Form Create eWallet | 🔲 planned | Dropdown channel, amount, env |
| FE-07 | SNAP panel — Inquiry & Status VA | 🔲 planned | Tombol one-click (dari db.json) |
| FE-08 | Checkout panel — Form Create Invoice | 🔲 planned | Input: price, productName, env |
| FE-09 | Checkout panel — Find Invoice | 🔲 planned | Tombol one-click |
| FE-10 | JSON Response Viewer | 🔲 planned | Pretty-print dengan syntax highlight |
| FE-11 | State Panel (db.json monitor) | 🔲 planned | lastVA, lastTrx, lastInvoice, dll |
| FE-12 | Environment switcher global | 🔲 planned | Dropdown: dev / sandbox / prod |
| FE-13 | Callback / Webhook log panel | 🔲 planned | Tampilkan `lastCallbackReceived` |

---

## 💡 Backlog — Phase 4: Future Ideas

| ID | Fitur | Status | Prioritas |
|---|---|---|---|
| ADV-01 | Real-time webhook log (WebSocket / SSE) | 💡 idea | 🔵 Medium |
| ADV-02 | History semua transaksi (bukan hanya last) | 💡 idea | 🔵 Medium |
| ADV-03 | Export response ke JSON / copy clipboard | 💡 idea | 🔵 Medium |
| ADV-04 | QR Code image renderer untuk QRIS response | 💡 idea | 🔵 Medium |
| ADV-05 | Mock mode (simulasi tanpa hit real API) | 💡 idea | 🟡 Low |
| ADV-06 | Docker Compose (API + Frontend) | 💡 idea | 🟡 Low |
| ADV-07 | Auth middleware API Key untuk API server | 💡 idea | 🟡 Low |
| ADV-08 | Unit test helpers (signature, timestamp) | 💡 idea | 🟡 Low |
| ADV-09 | Tambah channel eWallet baru (LinkAja, dll) | 💡 idea | 🔵 Medium |
| ADV-10 | Postman Collection auto-generate dari API spec | 💡 idea | 🟡 Low |

---

## ✅ Done — Phase 0: CLI Foundation

| ID | Fitur | Status |
|---|---|---|
| CLI-01 | `simulator.js` CLI runner | ✅ done |
| CLI-02 | Bash shortcut `create-va.sh` | ✅ done |
| CLI-03 | Bash shortcut `create-qris.sh` | ✅ done |
| CLI-04 | Bash shortcut `create-ewallet.sh` | ✅ done |
| CLI-05 | Bash shortcut `create-invoice.sh` | ✅ done |
| CLI-06 | Bash shortcut `find-invoice.sh` | ✅ done |
| CLI-07 | Bash shortcut `start-callback.sh` | ✅ done |
| CLI-08 | SNAP: Create VA | ✅ done |
| CLI-09 | SNAP: Inquiry VA | ✅ done |
| CLI-10 | SNAP: Payment Status VA | ✅ done |
| CLI-11 | SNAP: Create QRIS | ✅ done |
| CLI-12 | SNAP: Create eWallet (SPAY/DANA/OVO/SC/ASTRA) | ✅ done |
| CLI-13 | Checkout: Create Invoice | ✅ done |
| CLI-14 | Checkout: Find Invoice | ✅ done |
| CLI-15 | Webhook Receiver server (bare Node.js) | ✅ done |
| CLI-16 | RSA-SHA256 Signature (SNAP) | ✅ done |
| CLI-17 | HMAC-SHA256 Signature (Checkout) | ✅ done |
| CLI-18 | Callback Signature Verification | ✅ done |
| CLI-19 | Multi-environment support (dev/sandbox/prod) | ✅ done |
| CLI-20 | State storage via lowdb (`db.json`) | ✅ done |
