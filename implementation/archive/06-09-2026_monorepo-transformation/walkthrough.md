# Monorepo Restructuring & Verification Walkthrough

## 🌟 Ringkasan Hasil Restrukturisasi
Repository **snap-checkout-simulator** telah berhasil dirapikan menjadi arsitektur **Clean Monorepo** dengan pemisahan tanggung jawab (*Separation of Concerns*) yang sangat jelas:

```text
snap-checkout-simulator/
├── backend/                    # Seluruh engine backend, API Fastify & CLI Simulator
│   ├── api/                    # Fastify REST API Server (Port: 3001)
│   ├── config/                 # Konfigurasi & RSA Keys
│   ├── helpers/                # Signature, logger, timestamp, storage
│   ├── services/               # HTTP Client SNAP & Checkout Page
│   ├── templates/              # Payload JSON templates
│   ├── simulator.js            # CLI Runner utama
│   ├── server.js               # Webhook Callback Receiver standalone
│   ├── Dockerfile              # Docker image untuk deploy ke Fly.io
│   ├── .env                    # [Ignored] Kredensial lokal
│   ├── sample.env              # Template referensi file .env
│   ├── db.json                 # [Ignored] Database state transaksi lokal
│   └── package.json            # Dependensi backend
├── frontend/                   # Next.js 15+ App Router Web Dashboard (Port: 3000)
│   ├── app/                    # Pages & Proxy Route Handlers
│   ├── components/             # Reusable UI components
│   ├── .env.local              # Konfigurasi frontend (API_URL)
│   └── package.json            # Dependensi frontend
├── scripts/                    # CLI Helper Shortcuts (*.sh)
│   ├── create-va.sh            # CLI Shortcut: Create VA SNAP
│   ├── create-qris.sh          # CLI Shortcut: Generate QRIS SNAP
│   ├── create-ewallet.sh       # CLI Shortcut: Create eWallet SNAP
│   ├── create-invoice.sh       # CLI Shortcut: Create Invoice Checkout Page
│   ├── find-invoice.sh         # CLI Shortcut: Find Invoice Checkout Page
│   └── start-callback.sh       # CLI Shortcut: Jalankan Callback Server Receiver
├── docs/                       # Dokumentasi teknis terstruktur
│   ├── architecture.md         # Diagram arsitektur & komponen
│   ├── api-reference.md        # Dokumentasi REST API & Webhook
│   ├── roadmap.md              # Roadmap pengembangan
│   └── backlog.md              # Task backlog & tracking
├── fly.toml                    # Konfigurasi deployment Fly.io
├── vercel.json                 # Konfigurasi deployment Vercel
├── package.json                # Workspace root runner (npm run api, npm run dev:all)
└── README.md                   # Dokumentasi lengkap project
```

---

## 🧪 Hasil Verifikasi

| Komponen | Perintah Uji | Hasil |
|---|---|---|
| **CLI Shortcuts** | `./scripts/create-va.sh BNC 50000 dev` & `./scripts/create-qris.sh 25000 sandbox` | **BERHASIL** (Payload ter-generate, Signature RSA terhitung, request terkirim) |
| **Fastify API Server** | `GET http://localhost:3001/api/health` | **200 OK** (Status ONLINE) |
| **Frontend BFF Proxy** | `GET http://localhost:3000/api/health` | **200 OK** (Proxy ke Fastify lancar) |
| **Frontend Web UI** | `GET http://localhost:3000/` | **200 OK** (Halaman Dashboard rendered) |

---

## 🚀 Perintah Operasional Monorepo

```bash
# Jalankan Fastify API backend (Port 3001)
npm run api

# Jalankan Next.js Frontend Dashboard (Port 3000)
npm run dev:frontend

# Jalankan seluruh stack (Full-Stack All-in-One)
npm run dev:all

# Menjalankan CLI Shortcuts
./scripts/create-va.sh [CHANNEL] [AMOUNT] [ENV]
./scripts/create-qris.sh [AMOUNT] [ENV]
./scripts/create-ewallet.sh [CHANNEL] [AMOUNT] [ENV]
./scripts/create-invoice.sh [PRICE] [PRODUCT_NAME] [ENV]
./scripts/find-invoice.sh [ENV]
```
